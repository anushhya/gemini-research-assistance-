import { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  return (
    <div className="relative flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-medium">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your research documents..."
        disabled={disabled}
        className="min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent px-3 py-3 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!input.trim() || disabled}
        size="icon"
        className="h-12 w-12 shrink-0 rounded-xl gradient-primary hover:opacity-90 transition-opacity"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
