export type DocumentStatus = "uploading" | "processing" | "ready" | "error";

export type Document = {
  id: string;
  filename: string;
  file_size: number;
  file_path: string;
  mime_type: string;
  status: DocumentStatus;
  error_message: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
};
