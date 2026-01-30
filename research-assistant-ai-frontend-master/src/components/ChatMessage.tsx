import { FileText, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  page: number;
  source: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export function ChatMessage({ role, content, sources }: ChatMessageProps) {
  const isUser = role === "user";

  const getFileName = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 1];
  };

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "bg-transparent" : "bg-secondary/50"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "gradient-primary text-white"
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className="flex-1 space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          {isUser ? "You" : "Research Assistant"}
        </p>
        <div className="prose prose-sm max-w-none text-foreground">
          <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {sources && sources.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-soft transition-colors hover:bg-secondary"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{getFileName(source.source)}</span>
                  <span className="text-muted-foreground">p. {source.page}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
