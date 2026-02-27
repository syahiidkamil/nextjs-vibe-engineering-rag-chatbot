import { SendIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

type ChatInputProps = {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 flex gap-2 border-t bg-background px-4 py-3"
    >
      <input
        type="text"
        value={input}
        onChange={onInputChange}
        placeholder="Ketik pertanyaan Anda di sini..."
        disabled={isLoading}
        className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!input.trim() || isLoading}
      >
        {isLoading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <SendIcon className="size-4" />
        )}
      </Button>
    </form>
  );
}
