"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import type { ChatMessage, ChatSource } from "../types";
import {
  getMessages,
  createConversation,
  saveMessage,
} from "../actions/conversation-actions";

type ChatStatus = "idle" | "submitted" | "streaming";

let idCounter = 0;
function generateId(): string {
  return `msg_${Date.now()}_${++idCounter}`;
}

export function useChat() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("c");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | null>(conversationId);
  const isCreatingRef = useRef(false);

  // Keep ref in sync with current conversationId
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Load messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    if (isCreatingRef.current) {
      isCreatingRef.current = false;
      return;
    }

    let cancelled = false;
    setIsLoadingHistory(true);

    getMessages(conversationId)
      .then((msgs) => {
        if (!cancelled) setMessages(msgs);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const sendToApi = useCallback(
    async (allMessages: ChatMessage[], convId: string) => {
      setStatus("submitted");
      setError(null);

      // Add placeholder assistant message
      const assistantId = generateId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        text: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      let fullText = "";
      let finalSources: ChatSource[] | undefined;

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
                fullText += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, text: m.text + event.text }
                      : m
                  )
                );
              } else if (event.type === "finish") {
                finalSources = event.sources;
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
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        // Save assistant message to DB after stream completes
        if (fullText) {
          await saveMessage(convId, "assistant", fullText, finalSources);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
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
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        text,
        createdAt: new Date().toISOString(),
      };
      const updated = [...messages, userMsg];
      setMessages(updated);

      let convId = conversationIdRef.current;

      // Create conversation if needed (don't navigate yet)
      let isNew = false;
      if (!convId) {
        try {
          isCreatingRef.current = true;
          const title = text.slice(0, 80);
          const conversation = await createConversation(title);
          convId = conversation.id;
          conversationIdRef.current = convId;
          isNew = true;
        } catch (err) {
          setError(
            err instanceof Error ? err : new Error("Failed to create conversation")
          );
          setMessages(messages); // rollback the optimistically added user message
          toast.error("Gagal memulai percakapan. Periksa koneksi database.");
          return;
        }
      }

      // Save user message to DB (non-critical — don't block AI response)
      try {
        await saveMessage(convId, "user", text);
      } catch {
        // Message exists in local state; will be missing from DB on refresh
      }

      // Critical path: start the AI response
      sendToApi(updated, convId);

      // Update URL after API call is initiated
      if (isNew) {
        router.replace(`/chat?c=${convId}`);
      }
    },
    [messages, sendToApi, router]
  );

  const regenerate = useCallback(() => {
    const convId = conversationIdRef.current;
    if (!convId) return;

    const withoutLast = messages.filter((_, i) => {
      if (i !== messages.length - 1) return true;
      return messages[i].role !== "assistant";
    });
    setMessages(withoutLast);
    sendToApi(withoutLast, convId);
  }, [messages, sendToApi]);

  return {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    isLoadingHistory,
    conversationId,
  };
}
