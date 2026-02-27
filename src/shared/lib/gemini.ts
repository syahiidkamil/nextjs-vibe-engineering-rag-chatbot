const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const CHAT_MODEL = "gemini-3-flash-preview";
const EMBEDDING_MODEL = "gemini-embedding-001";

// --- Embeddings ---

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/${EMBEDDING_MODEL}:embedContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Embedding API failed (${res.status}): ${error}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

export async function embedManyTexts(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map((t) => embedText(t)));
}

// --- Chat Streaming ---

type GeminiMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

/**
 * Streams chat completion from Gemini API.
 * Returns a ReadableStream that yields text chunks.
 */
export function streamChat(
  messages: GeminiMessage[],
  systemPrompt?: string
): ReadableStream<string> {
  const body: Record<string, unknown> = { contents: messages };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  return new ReadableStream<string>({
    async start(controller) {
      const res = await fetch(
        `${BASE_URL}/${CHAT_MODEL}:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const error = await res.text();
        controller.error(
          new Error(`Chat API failed (${res.status}): ${error}`)
        );
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop()!; // keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const chunk = JSON.parse(jsonStr);
              const text =
                chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              if (text) {
                controller.enqueue(text);
              }
            } catch {
              // skip malformed JSON chunks
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}
