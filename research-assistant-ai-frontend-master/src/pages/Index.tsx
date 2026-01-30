import { useRef, useEffect } from "react";
import { BookOpen, Trash2, Sparkles, ArrowLeft } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { PdfUpload } from "@/components/PdfUpload";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const { messages, isLoading, sendQuery, clearHistory } = useChatHistory();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get first 3 messages for preview
  const previewMessages = messages.slice(0, 3);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-80 shrink-0 border-r bg-card p-6 lg:block">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Research Assistant</h1>
            <p className="text-xs text-muted-foreground">Literature Review AI</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground tracking-wide">
              Knowledge Base
            </h2>
            <PdfUpload />
          </div>

          <div className="border-t pt-6">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground tracking-wide">
              Chat History
            </h2>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {messages.length} messages
              </p>
              {messages.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear History
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all messages. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearHistory}>
                        Clear History
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col">
        {/* Header with Back Button */}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-white shadow-medium mb-6">
                <Sparkles className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-center">
                Cloud Research Assistant
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Upload your research PDFs and ask questions. I'll help you analyze and summarize key findings from your literature.
              </p>

            </div>
          ) : (
            <div className="divide-y">
              {/* Show first 3 messages as preview at top */}
              {previewMessages.length > 0 && messages.length > 3 && (
                <div className="bg-secondary/30 p-4 border-b">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide mb-3">
                    Recent History
                  </p>
                  <div className="space-y-2">
                    {previewMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="rounded-lg bg-card p-3 text-sm truncate"
                      >
                        <span className="font-medium text-primary">
                          {msg.role === "user" ? "You: " : "AI: "}
                        </span>
                        <span className="text-muted-foreground">
                          {msg.content.substring(0, 60)}
                          {msg.content.length > 60 ? "..." : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                />
              ))}
              {isLoading && (
                <div className="flex gap-4 px-4 py-6 bg-secondary/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-primary text-white">
                    <BookOpen className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Research Assistant
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.1s]" />
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={sendQuery} disabled={isLoading} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Upload PDFs to build your knowledge base, then ask questions
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
