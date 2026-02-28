import type { SearchResult } from "./vector-search";

export type SourceReference = {
  filename: string;
  chunkIndex: number;
};

export function buildRagContext(results: SearchResult[]): {
  contextText: string;
  sources: SourceReference[];
  hasRelevantContext: boolean;
} {
  if (results.length === 0) {
    return { contextText: "", sources: [], hasRelevantContext: false };
  }

  const sourceMap = new Map<string, SourceReference>();

  const contextParts = results.map((r) => {
    if (!sourceMap.has(r.filename)) {
      sourceMap.set(r.filename, {
        filename: r.filename,
        chunkIndex: r.chunk_index,
      });
    }
    return `[Dokumen: ${r.filename}, Bagian ${r.chunk_index + 1}]\n${r.content}`;
  });

  return {
    contextText: contextParts.join("\n\n---\n\n"),
    sources: Array.from(sourceMap.values()),
    hasRelevantContext: results.length > 0,
  };
}
