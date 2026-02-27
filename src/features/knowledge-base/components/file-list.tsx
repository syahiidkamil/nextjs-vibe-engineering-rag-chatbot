import { FileItem } from "./file-item";
import type { Document } from "../types";

type FileListProps = {
  documents: Document[];
};

export function FileList({ documents }: FileListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        <p>Belum ada file yang diunggah.</p>
        <p className="mt-1">
          Unggah file pertama agar chatbot bisa menjawab pertanyaan pelanggan.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        File Diunggah ({documents.length} file)
      </h2>
      <div className="rounded-lg border">
        {documents.map((doc) => (
          <FileItem key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}
