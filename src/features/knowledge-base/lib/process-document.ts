import { supabase } from "@/shared/lib/supabase";
import { embedManyTexts } from "@/shared/lib/gemini";
import { extractTextFromPdf } from "./pdf-extractor";
import { splitTextIntoChunks } from "./chunker";

export async function processDocument(documentId: string): Promise<void> {
  try {
    // 1. Update status -> "processing"
    await supabase
      .from("documents")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", documentId);

    // 2. Fetch document metadata
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("file_path, mime_type, filename")
      .eq("id", documentId)
      .single();

    if (docError || !doc) throw new Error("Document not found");

    // 3. Download file from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(doc.file_path);

    if (downloadError || !fileData) throw new Error("Failed to download file");

    // 4. Extract text based on MIME type
    const buffer = Buffer.from(await fileData.arrayBuffer());
    let text: string;

    if (doc.mime_type === "application/pdf") {
      text = await extractTextFromPdf(buffer);
    } else if (doc.mime_type === "text/plain") {
      text = buffer.toString("utf-8");
    } else {
      throw new Error(`Unsupported mime type: ${doc.mime_type}`);
    }

    if (!text.trim()) {
      throw new Error("Dokumen tidak mengandung teks yang bisa diekstrak");
    }

    // 5. Split text into chunks
    const chunks = splitTextIntoChunks(text);

    // 6. Generate embeddings for all chunks (batch)
    const embeddings = await embedManyTexts(
      chunks.map((chunk) => chunk.content)
    );

    // 7. Save chunks + embeddings to DB
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: documentId,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      embedding: JSON.stringify(embeddings[i]),
      metadata: chunk.metadata,
    }));

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(chunkRows);

    if (insertError) throw new Error(`Failed to insert chunks: ${insertError.message}`);

    // 8. Update document status -> "ready"
    await supabase
      .from("documents")
      .update({
        status: "ready",
        chunk_count: chunks.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);
  } catch (error) {
    // Update status -> "error" with message
    const message = error instanceof Error ? error.message : "Unknown error";
    await supabase
      .from("documents")
      .update({
        status: "error",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);
  }
}
