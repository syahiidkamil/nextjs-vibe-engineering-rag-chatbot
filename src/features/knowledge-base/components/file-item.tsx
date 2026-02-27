"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon, FileTextIcon, RefreshCwIcon } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DeleteDialog } from "./delete-dialog";
import type { Document } from "../types";

type FileItemProps = {
  document: Document;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function StatusBadge({ status }: { status: Document["status"] }) {
  switch (status) {
    case "ready":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Siap</Badge>;
    case "processing":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Memproses...</Badge>;
    case "uploading":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Mengunggah...</Badge>;
    case "error":
      return <Badge variant="destructive">Gagal</Badge>;
  }
}

export function FileItem({ document: doc }: FileItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  // Poll for status updates when uploading or processing
  useEffect(() => {
    if (doc.status !== "uploading" && doc.status !== "processing") return;

    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [doc.status, router]);

  const showActions = doc.status === "ready" || doc.status === "error";

  return (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{doc.filename}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(doc.file_size)} &middot; {formatDate(doc.created_at)}
          </p>
          {doc.status === "error" && doc.error_message && (
            <p className="mt-1 text-xs text-destructive">{doc.error_message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={doc.status} />
        {doc.status === "error" && (
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <RefreshCwIcon className="mr-1 size-3" />
            Coba Lagi
          </Button>
        )}
        {showActions && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        )}
      </div>
      <DeleteDialog
        documentId={doc.id}
        filename={doc.filename}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}
