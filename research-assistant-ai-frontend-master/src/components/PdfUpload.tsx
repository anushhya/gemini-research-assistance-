import { useState, useRef } from "react";
import { Upload, FileText, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface UploadResult {
  filename: string;
  pages: number;
  chunks: number;
  status: string;
}

interface PdfUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export function PdfUpload({ onUploadComplete }: PdfUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
        className: 'max-w-xl w-full',
      });
      return;
    }

    setIsUploading(true);
    setUploadedFile(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // "http://localhost:3000/upload-pdf"
      const response = await fetch("https://research-assistant-ai-backend.vercel.app/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result: UploadResult = await response.json();
      setUploadedFile(result);
      onUploadComplete?.(result);

      toast({
        title: "PDF uploaded successfully",
        description: `${result.filename} - ${result.pages} pages, ${result.chunks} chunks processed`,
        className: 'max-w-xl w-full',
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload the PDF. Please try again.",
        variant: "destructive",
        className: 'max-w-xl w-full',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-200",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/50",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium">Processing PDF...</p>
          </>
        ) : uploadedFile ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium line-clamp-2 break-all">{uploadedFile.filename}</p>
            <p className="text-xs text-muted-foreground">
              {uploadedFile.pages} pages • {uploadedFile.chunks} chunks
            </p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium">Upload PDF</p>
            <p className="text-xs text-muted-foreground">
              Drag & drop or click to browse
            </p>
          </>
        )}
      </div>

      {uploadedFile && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setUploadedFile(null);
            fileInputRef.current?.click();
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Upload another PDF
        </Button>
      )}
    </div>
  );
}
