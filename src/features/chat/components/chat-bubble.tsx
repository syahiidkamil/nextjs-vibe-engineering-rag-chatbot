import ReactMarkdown from "react-markdown";
import { BotIcon, UserIcon } from "lucide-react";
import { SourceBlock } from "./source-block";
import type { ChatMessage } from "../types";

type ChatBubbleProps = {
  message: ChatMessage;
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];
  const day = days[date.getDay()];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${day}, ${d} ${m} ${y} • ${hh}:${mm}`;
}

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
      <div className={`flex flex-col max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
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
        <span
          className={`mt-1 font-light text-muted-foreground/50 ${isUser ? "text-right pr-1.5" : "text-left pl-1.5"}`}
          style={{ fontSize: "11px" }}
        >
          {formatTimestamp(message.createdAt)}
        </span>
        {!isUser && sources.length > 0 && <SourceBlock sources={sources} />}
      </div>
    </div>
  );
}
