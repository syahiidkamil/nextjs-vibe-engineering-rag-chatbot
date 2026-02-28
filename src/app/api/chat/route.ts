import { streamChat } from "@/shared/lib/gemini";
import { embedQuery } from "@/features/chat/lib/embeddings";
import { searchDocuments } from "@/features/chat/lib/vector-search";
import { buildRagContext } from "@/features/chat/lib/rag-context";
import { getSystemPrompt } from "@/features/chat/lib/system-prompt";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get last user message text
  const lastUserMessage = messages
    .filter((m: { role: string }) => m.role === "user")
    .pop();

  if (!lastUserMessage) {
    return new Response("No user message found", { status: 400 });
  }

  // RAG Pipeline
  const queryText = lastUserMessage.text ?? lastUserMessage.content ?? "";
  const queryEmbedding = await embedQuery(queryText);
  const searchResults = await searchDocuments(queryEmbedding);
  const { contextText, sources } = buildRagContext(searchResults);
  const systemPrompt = getSystemPrompt(contextText);

  // Convert to Gemini message format
  const geminiMessages = messages.map(
    (m: { role: string; text?: string; content?: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text ?? m.content ?? "" }],
    })
  );

  // Stream from Gemini
  const textStream = streamChat(geminiMessages, systemPrompt);
  const reader = textStream.getReader();

  // Build our own SSE response
  const sseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text", text: value })}\n\n`
            )
          );
        }

        // Send sources on finish
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "finish", sources })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("[chat/route] SSE stream error:", err);
        const message = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(sseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
