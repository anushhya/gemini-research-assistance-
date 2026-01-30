import { BadRequestException, Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { PineconeStore } from '@langchain/pinecone';
import { ConfigService } from '@nestjs/config';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

@Injectable()
export class AppService {
  private writeFile = promisify(fs.writeFile);
  private unlink = promisify(fs.unlink);
  private splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });

  constructor(private readonly configService: ConfigService) {}

  async uploadPdf(
    file: any,
    embeddings: GoogleGenerativeAIEmbeddings,
    model: ChatGoogleGenerativeAI,
    pineconeIndex: any,
    vectorStore: PineconeStore,
  ) {
    if (!file) {
      throw new BadRequestException('No PDF file provided');
    }

    if (
      file.mimetype !== 'application/pdf' &&
      !file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      throw new BadRequestException('File must be a PDF');
    }

    let tempFilePath: string | null = null;

    try {
      // tempFilePath = path.join(
      //   process.cwd(),
      //   `temp_${Date.now()}_${file.originalname}`,
      // );

      tempFilePath = path.join(
        '/tmp',
        `temp_${Date.now()}_${file.originalname}`,
      );

      await this.writeFile(tempFilePath, file.buffer);

      const docs = await this.loadPdf(tempFilePath);
      const chunks = await this.chunkDocs(docs);

      const sanitizedChunks = chunks.map((chunk) => ({
        ...chunk,
        metadata: {
          source: chunk.metadata?.source,
          pageNumber: chunk.metadata?.loc?.pageNumber,
        },
      }));

      console.log(
        'Example Chunk: ',
        JSON.stringify(sanitizedChunks[0]),
        sanitizedChunks.length,
      );

      await PineconeStore.fromDocuments(sanitizedChunks, embeddings, {
        pineconeIndex: pineconeIndex,
        namespace: this.configService.get<string>('PINECONE_NAMESPACE') || '',
      });

      const sampleResult = await vectorStore.similaritySearch(
        'What is latent diffusion?',
        1,
      );

      return {
        filename: file.originalname,
        pages: docs.length,
        chunks: chunks.length,
        sampleResult: sampleResult,
        status: 'ingested',
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new BadRequestException(`Failed to process PDF: ${error.message}`);
    } finally {
      if (tempFilePath) {
        try {
          await this.unlink(tempFilePath);
          console.log('Temporary file cleaned up');
        } catch (cleanupError) {
          console.error('Error cleaning up temporary file:', cleanupError);
        }
      }
    }
  }

  async performSimilaritySearch(
    query: string,
    limit: number,
    vectorStore: PineconeStore,
  ) {
    return await vectorStore.similaritySearch(query, limit);
  }

  async generateResponse(
    query: string,
    docs: any[],
    model: ChatGoogleGenerativeAI,
  ) {
    const systemPrompt = this.getSystemPrompt(query);

    const context = docs
      .map(
        (d, i) =>
          `Source ${i + 1} (page ${d.metadata?.pageNumber}):\n${d.pageContent}`,
      )
      .join('\n\n---\n\n');

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      [
        'human',
        `Context: ${context}
         User Question: ${query}
         Answer:`,
      ],
    ]);

    const chain = RunnableSequence.from([prompt, model]);

    return await chain.invoke({});
  }

  async loadPdf(filePath: string) {
    const loader = new PDFLoader(filePath);
    return await loader.load();
  }

  async chunkDocs(docs: any) {
    return await this.splitter.splitDocuments(docs);
  }

  private getSystemPrompt(query: string): string {
    const { format, length } = this.inferResponseStyle(query);

    return `
      You are a research assistant.
      
      User intent:
      - The user asked: "${query}"
      - Respond using ${format}.
      - The response should be ${length}.
      
      Rules:
      - Use the provided context as factual grounding.
      - You may rephrase, summarize, and synthesize.
      - Do NOT invent citations, equations, or claims not supported by context.
      - If context is insufficient, say so clearly.
      
      Tone:
      - Clear
      - Academic
      - Neutral
    `;
  }

  private inferResponseStyle(query: string): {
    format: string;
    length: string;
  } {
    const q = query.toLowerCase();

    const format =
      q.includes('point') || q.includes('list') || q.includes('steps')
        ? 'bullet points'
        : 'paragraphs';

    const length = q.includes('short')
      ? 'brief'
      : q.includes('detailed') || q.includes('explain')
        ? 'detailed'
        : 'concise';

    return { format, length };
  }
}
