import ReactMarkdown from "react-markdown";
import { BotIcon, UserIcon } from "lucide-react";
import { SourceBlock } from "./source-block";
import type { ChatMessage } from "../types";

type ChatBubbleProps = {
  message: ChatMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const sources = message.sources ?? [];

  return (
    <div
      className={`flex gap-3 px-4 py-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-lg px-4 py-2.5 text-sm ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && sources.length > 0 && <SourceBlock sources={sources} />}
      </div>
    </div>
  );
}
