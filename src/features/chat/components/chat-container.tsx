"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2Icon } from "lucide-react";
import { useChat } from "../hooks/use-chat";
import { WelcomeState } from "./welcome-state";
import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ErrorMessage } from "./error-message";

export function ChatContainer() {
  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    isLoadingHistory,
    conversationId,
  } = useChat();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  }

  function handleSuggestionClick(text: string) {
    sendMessage(text);
  }

  if (isLoadingHistory) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {messages.length === 0 && !conversationId ? (
        <WelcomeState onSuggestionClick={handleSuggestionClick} />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
          {messages.map((message) => {
            if (message.role === "assistant" && !message.text && status === "submitted") return null;
            return <ChatBubble key={message.id} message={message} />;
          })}
          {status === "submitted" && <TypingIndicator />}
          {error && <ErrorMessage onRetry={regenerate} />}
        </div>
      )}
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
