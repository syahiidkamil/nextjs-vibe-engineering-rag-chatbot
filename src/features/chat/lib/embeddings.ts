import { embedText } from "@/shared/lib/gemini";

export async function embedQuery(query: string): Promise<number[]> {
  const embedding = await embedText(query);
  return embedding;
}
