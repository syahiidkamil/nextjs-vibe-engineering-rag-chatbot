export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
};

export type ChatSource = {
  filename: string;
  chunkIndex: number;
};
