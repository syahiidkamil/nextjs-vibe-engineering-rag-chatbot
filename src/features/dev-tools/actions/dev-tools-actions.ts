"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/shared/lib/supabase";
import type { UsageStats } from "../types";

export async function getUsageStats(): Promise<UsageStats> {
  const { count: docCount, error: docError } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  if (docError) throw new Error(`Failed to count documents: ${docError.message}`);

  const { count: chunkCount, error: chunkError } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true });

  if (chunkError) throw new Error(`Failed to count chunks: ${chunkError.message}`);

  const { data: sizeData, error: sizeError } = await supabase
    .from("documents")
    .select("file_size");

  if (sizeError) throw new Error(`Failed to calculate storage: ${sizeError.message}`);

  const totalBytes = (sizeData || []).reduce(
    (sum, doc) => sum + (doc.file_size || 0),
    0
  );

  return {
    document_count: docCount ?? 0,
    chunk_count: chunkCount ?? 0,
    storage_used_bytes: totalBytes,
  };
}

export async function resetAllData(): Promise<{ error: string | null }> {
  // 1. Get all file_paths to delete from Storage
  const { data: docs } = await supabase
    .from("documents")
    .select("file_path");

  // 2. Delete all files from Storage bucket
  if (docs && docs.length > 0) {
    const filePaths = docs.map((d) => d.file_path);
    await supabase.storage.from("documents").remove(filePaths);
  }

  // 3. Delete all document_chunks
  const { error: chunkError } = await supabase
    .from("document_chunks")
    .delete()
    .gt("created_at", "1970-01-01");

  if (chunkError) return { error: `Gagal menghapus chunks: ${chunkError.message}` };

  // 4. Delete all documents
  const { error: docError } = await supabase
    .from("documents")
    .delete()
    .gt("created_at", "1970-01-01");

  if (docError) return { error: `Gagal menghapus dokumen: ${docError.message}` };

  revalidatePath("/dev-tools");
  revalidatePath("/knowledge-base");
  return { error: null };
}
