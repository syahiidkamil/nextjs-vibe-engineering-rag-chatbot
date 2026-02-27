import { PaperclipIcon } from "lucide-react";
import type { ChatSource } from "../types";

type SourceBlockProps = {
  sources: ChatSource[];
};

export function SourceBlock({ sources }: SourceBlockProps) {
  if (sources.length === 0) return null;

  // Deduplicate by filename
  const uniqueFiles = [...new Set(sources.map((s) => s.filename))];

  return (
    <div className="mt-2 rounded-md border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <PaperclipIcon className="size-3" />
        <span>Sumber Referensi:</span>
      </div>
      <ul className="mt-1 space-y-0.5">
        {uniqueFiles.map((filename) => (
          <li key={filename} className="text-xs text-muted-foreground">
            &bull; {filename}
          </li>
        ))}
      </ul>
    </div>
  );
}
