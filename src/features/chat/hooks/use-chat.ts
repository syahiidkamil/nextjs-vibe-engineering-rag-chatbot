"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "../types";

type ChatStatus = "idle" | "submitted" | "streaming";

let idCounter = 0;
function generateId(): string {
  return `msg_${Date.now()}_${++idCounter}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendToApi = useCallback(
    async (allMessages: ChatMessage[]) => {
      setStatus("submitted");
      setError(null);

      // Add placeholder assistant message
      const assistantId = generateId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        text: "",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({
              role: m.role,
              text: m.text,
            })),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        setStatus("streaming");

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop()!;

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const event = JSON.parse(payload);

              if (event.type === "text") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, text: m.text + event.text }
                      : m
                  )
                );
              } else if (event.type === "finish") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, sources: event.sources }
                      : m
                  )
                );
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue; // skip malformed JSON
              throw e;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        // Remove empty assistant message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId || m.text.length > 0)
        );
      } finally {
        setStatus("idle");
        abortRef.current = null;
      }
    },
    []
  );

  const sendMessage = useCallback(
    (text: string) => {
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        text,
      };
      const updated = [...messages, userMsg];
      setMessages(updated);
      sendToApi(updated);
    },
    [messages, sendToApi]
  );

  const regenerate = useCallback(() => {
    // Remove last assistant message and re-send
    const withoutLast = messages.filter((_, i) => {
      if (i !== messages.length - 1) return true;
      return messages[i].role !== "assistant";
    });
    setMessages(withoutLast);
    sendToApi(withoutLast);
  }, [messages, sendToApi]);

  return { messages, sendMessage, status, error, regenerate };
}
