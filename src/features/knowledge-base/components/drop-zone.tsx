"use client";

import { useState, useRef, useTransition } from "react";
import { UploadCloudIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "../actions/document-actions";

const ALLOWED_TYPES = ["application/pdf", "text/plain"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndUpload(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan PDF atau TXT.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Ukuran file melebihi batas 10 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadDocument(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${file.name}" berhasil diunggah`);
      }
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      } ${isPending ? "pointer-events-none opacity-50" : ""}`}
    >
      <UploadCloudIcon className="size-8 text-muted-foreground" />
      {isDragging ? (
        <p className="text-sm font-medium text-primary">
          Lepaskan file di sini!
        </p>
      ) : (
        <>
          <p className="text-sm font-medium">
            {isPending ? "Mengunggah..." : "Drag & drop file ke sini"}
          </p>
          <p className="text-xs text-muted-foreground">
            atau klik untuk pilih file
          </p>
          <p className="text-xs text-muted-foreground">
            Mendukung: PDF, TXT &middot; Maks: 10 MB per file
          </p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={handleChange}
        disabled={isPending}
      />
    </div>
  );
}
