"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/shared/lib/supabase";
import { processDocument } from "../lib/process-document";
import type { Document } from "../types";

export async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return data;
}

export async function uploadDocument(
  formData: FormData
): Promise<{ error: string | null; documentId?: string }> {
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "File is required" };
  }

  // Validate MIME type (PDF + TXT only for MVP)
  const allowedTypes = ["application/pdf", "text/plain"];

  if (!allowedTypes.includes(file.type)) {
    return { error: "Format file tidak didukung. Gunakan PDF atau TXT." };
  }

  // Validate size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "Ukuran file melebihi batas 10 MB." };
  }

  // 1. Upload to Supabase Storage
  const filePath = `${crypto.randomUUID()}-${file.name}`;
  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (storageError) {
    return { error: `Gagal mengunggah file: ${storageError.message}` };
  }

  // 2. Save metadata to documents table
  const { data, error: dbError } = await supabase
    .from("documents")
    .insert({
      filename: file.name,
      file_size: file.size,
      file_path: filePath,
      mime_type: file.type,
      status: "uploading",
    })
    .select("id")
    .single();

  if (dbError) {
    // Rollback: remove file from storage
    await supabase.storage.from("documents").remove([filePath]);
    return { error: `Gagal menyimpan metadata: ${dbError.message}` };
  }

  // Fire-and-forget: process document in background
  processDocument(data.id).catch(console.error);

  revalidatePath("/knowledge-base");
  return { error: null, documentId: data.id };
}

export async function deleteDocument(
  id: string
): Promise<{ error: string | null }> {
  // 1. Get file_path before deleting
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (fetchError || !doc) {
    return { error: "Dokumen tidak ditemukan" };
  }

  // 2. Delete file from Storage
  await supabase.storage.from("documents").remove([doc.file_path]);

  // 3. Delete from DB (chunks cascade automatically)
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return { error: `Gagal menghapus dokumen: ${error.message}` };
  }

  revalidatePath("/knowledge-base");
  return { error: null };
}
