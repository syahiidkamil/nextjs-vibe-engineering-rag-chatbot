"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "../hooks/use-chat";
import { WelcomeState } from "./welcome-state";
import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ErrorMessage } from "./error-message";

export function ChatContainer() {
  const { messages, sendMessage, status, error, regenerate } = useChat();

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

  return (
    <div className="flex h-full flex-col">
      {messages.length === 0 ? (
        <WelcomeState onSuggestionClick={handleSuggestionClick} />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
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
