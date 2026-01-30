import {
  BadRequestException,
  Body,
  Controller,
  OnModuleInit,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { ConfigService } from '@nestjs/config';
import { PineconeStore } from '@langchain/pinecone';

@Controller()
export class AppController implements OnModuleInit {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private model: ChatGoogleGenerativeAI;
  private pineconeIndex: any;
  private vectorStore: any;
  private isInitialized = false;

  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      console.log('Initializing AI components...');

      this.model = new ChatGoogleGenerativeAI({
        apiKey: this.configService.get<string>('GOOGLE_API_KEY') || '',
        model: this.configService.get<string>('GEMINI_MODEL_NAME') || '',
        temperature: 0.6,
      });

      this.embeddings = new GoogleGenerativeAIEmbeddings({
        model: this.configService.get<string>('GEMINI_EMBEDDING_MODEL') || '',
      });

      const pinecone = new PineconeClient({
        apiKey: this.configService.get<string>('PINECONE_API_KEY') || '',
      });

      this.pineconeIndex = pinecone.Index(
        this.configService.get<string>('PINECONE_INDEX_NAME') || '',
      );

      this.vectorStore = await PineconeStore.fromExistingIndex(
        this.embeddings,
        {
          pineconeIndex: this.pineconeIndex,
          namespace: this.configService.get<string>('PINECONE_NAMESPACE') || '',
          maxConcurrency: 5,
        },
      );

      this.isInitialized = true;
      console.log('AI components initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI components:', error);
      throw error;
    }
  }

  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@UploadedFile() file: any) {
    if (!this.isInitialized) {
      throw new Error('AI components not initialized yet');
    }

    return await this.appService.uploadPdf(
      file,
      this.embeddings,
      this.model,
      this.pineconeIndex,
      this.vectorStore,
    );
  }

  @Post('chat')
  async chat(
    @Body()
    request: {
      query: string;
      limit?: number;
    },
  ) {
    const { query, limit = 1 } = request;

    if (!query?.trim()) {
      throw new BadRequestException('Query is required');
    }

    const searchResults = await this.appService.performSimilaritySearch(
      query,
      limit,
      this.vectorStore,
    );

    const response = await this.appService.generateResponse(
      query,
      searchResults,
      this.model,
    );

    return {
      query,
      answer: response.content,
      sources: searchResults.map((r) => ({
        page: r.metadata?.pageNumber,
        source: r.metadata?.source,
      })),
      resultsFound: searchResults.length,
    };
  }
}
