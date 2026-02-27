import { FileTextIcon, LayersIcon, HardDriveIcon } from "lucide-react";
import type { UsageStats } from "../types";

type UsageStatsDisplayProps = {
  stats: UsageStats;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UsageStatsDisplay({ stats }: UsageStatsDisplayProps) {
  const cards = [
    {
      label: "Jumlah Dokumen",
      value: stats.document_count,
      icon: FileTextIcon,
    },
    {
      label: "Jumlah Chunks",
      value: stats.chunk_count,
      icon: LayersIcon,
    },
    {
      label: "Storage Terpakai",
      value: formatBytes(stats.storage_used_bytes),
      icon: HardDriveIcon,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <card.icon className="size-4" />
            <span className="text-xs font-medium">{card.label}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
