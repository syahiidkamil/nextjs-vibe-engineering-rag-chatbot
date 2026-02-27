# Rencana Implementasi Teknis — Janasku RAG Chatbot MVP

Dokumen ini adalah panduan implementasi langkah-demi-langkah berdasarkan keputusan yang sudah diambil di dokumen brainstorming (06_A). Setiap fase berisi: file yang harus dibuat/diubah beserta path lengkap, SQL migrasi, signature function, props interface komponen, pola kode yang harus diikuti, dan tes verifikasi.

**Konvensi Acuan** (dari fitur todo yang sudah ada):
- Server Actions: `"use server"` di baris pertama, import supabase dari `@/shared/lib/supabase`
- Read actions: return data langsung, `throw new Error(...)` jika gagal
- Mutation actions: return `{ error: string | null }`, tidak pernah throw
- Cache invalidation: `revalidatePath("/path")` setelah mutasi
- Types: hand-written di `features/<name>/types.ts`, tanpa generated DB types
- Barrel exports: hanya public API yang di-export dari `index.ts`
- Pages: thin async Server Components (< 30 baris), fetch data lalu pass sebagai props
- Components: server by default, `"use client"` hanya jika butuh hooks/events
- Dependency rule: `app → features → shared` (features TIDAK PERNAH import features lain)
- Path alias: `@/*` maps ke `src/*`

---

## Phase 0: Fondasi

### 0.1 Install Dependencies

```bash
# PDF parsing
bun add pdf-parse
bun add -D @types/pdf-parse

# shadcn components (otomatis ke src/shared/components/ui/)
bunx shadcn@latest add dialog badge sonner scroll-area alert-dialog dropdown-menu separator progress
```

> **Catatan**: Tidak ada dependency AI SDK. Integrasi Gemini menggunakan direct HTTPS API call via `fetch()` — lebih stabil, tanpa bug serialisasi SDK, dan mudah di-debug.

### 0.2 Environment Variables

**File diubah**: `/.env.local` (tambah baris), `/.env.example` (tambah baris)

```env
# Existing
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Baru
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### 0.3 Next.js Config — Server External Packages

**File diubah**: `/next.config.ts`

`pdf-parse` menggunakan fitur Node.js (`fs`, `path`) yang tidak kompatibel dengan bundling Next.js. Harus ditambahkan ke `serverExternalPackages`.

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
```

### 0.4 Supabase Migrations

**File baru**: `/supabase/migrations/<timestamp>_create_rag_infrastructure.sql`

Nama timestamp mengikuti pola existing (`20260227092516_create_todos_table.sql`), misalnya `20260228100000_create_rag_infrastructure.sql`.

```sql
-- 1. Aktifkan pgvector extension
create extension if not exists vector with schema extensions;

-- 2. Tabel documents (metadata file yang diunggah)
create table documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_size integer not null,
  file_path text not null,
  mime_type text not null,
  status text not null default 'uploading'
    check (status in ('uploading', 'processing', 'ready', 'error')),
  error_message text,
  chunk_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;
create policy "Allow all operations on documents"
  on documents for all using (true) with check (true);

-- 3. Tabel document_chunks (potongan teks + embedding vektor)
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  embedding vector(768),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table document_chunks enable row level security;
create policy "Allow all operations on document_chunks"
  on document_chunks for all using (true) with check (true);

-- Index untuk pencarian vektor (cosine distance)
create index on document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Fungsi pencarian kemiripan (RPC)
create or replace function match_documents(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  metadata jsonb,
  similarity float,
  filename text
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.filename
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where d.status = 'ready'
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 5. Storage bucket untuk dokumen
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Policy: izinkan semua operasi di bucket documents (MVP tanpa auth)
create policy "Allow all uploads to documents bucket"
  on storage.objects for insert
  with check (bucket_id = 'documents');

create policy "Allow all reads from documents bucket"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Allow all deletes from documents bucket"
  on storage.objects for delete
  using (bucket_id = 'documents');
```

**Catatan penting tentang IVFFlat index**: Index `ivfflat` membutuhkan minimal beberapa row data agar efektif. Untuk MVP dengan sedikit dokumen ini masih akan berfungsi. Jika list count (100) terlalu besar untuk data kecil, PostgreSQL akan fallback ke sequential scan yang tetap cepat untuk dataset kecil.

### 0.5 Shared Gemini Client (Direct HTTPS API)

**File baru**: `/src/shared/lib/gemini.ts`

```typescript
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const CHAT_MODEL = "gemini-3-flash-preview";
const EMBEDDING_MODEL = "gemini-embedding-001";

// --- Embeddings ---

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/${EMBEDDING_MODEL}:embedContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Embedding API failed (${res.status}): ${error}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

export async function embedManyTexts(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map((t) => embedText(t)));
}

// --- Chat Streaming ---

type GeminiMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

export function streamChat(
  messages: GeminiMessage[],
  systemPrompt?: string
): ReadableStream<string> {
  const body: Record<string, unknown> = { contents: messages };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  return new ReadableStream<string>({
    async start(controller) {
      const res = await fetch(
        `${BASE_URL}/${CHAT_MODEL}:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const error = await res.text();
        controller.error(new Error(`Chat API failed (${res.status}): ${error}`));
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop()!;

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const chunk = JSON.parse(jsonStr);
              const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              if (text) controller.enqueue(text);
            } catch {
              // skip malformed JSON chunks
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}
```

**Mengapa direct HTTPS, bukan AI SDK**: `@ai-sdk/google` dan `@google/genai` memiliki bug serialisasi pada embedding request (mengirim `parts: [{}]` ke API, menghasilkan error `required oneof field 'data' must have one initialized field`). Direct fetch lebih stabil, mudah di-debug, dan tanpa dependency tambahan.

**Mengapa shared**: Modul ini digunakan oleh dua fitur berbeda (knowledge-base untuk pemrosesan dokumen, chat untuk embed query). Karena berada di `shared/lib/`, kedua fitur bisa mengimportnya tanpa melanggar dependency rule.

**Model**: Chat menggunakan `gemini-3-flash-preview`, embedding menggunakan `gemini-embedding-001` (768 dimensi).

### 0.6 Shared Navbar Component

**File baru**: `/src/shared/components/navbar.tsx`

```typescript
// Server Component (default, tanpa "use client")
import Link from "next/link";

// Props interface
type NavbarProps = {
  // Tidak ada props — navbar membaca pathname dari server
};
```

Navbar mengikuti desain dari wireframe high-fidelity:
- Logo "Janasku" di kiri (warna primary/kunyit, menggunakan Lucide `BotMessageSquareIcon` atau emoji)
- Link navigasi di kanan: "Knowledge Base", "Chatbot"
- Link aktif ditandai dengan border primary dan background secondary
- Garis bawah oranye (border-b dengan warna primary) di bawah navbar

**Catatan**: Karena ini Server Component, untuk menandai halaman aktif kita bisa menggunakan approach sederhana tanpa `usePathname()`. Alternatifnya, buat thin client wrapper hanya untuk highlight logic, atau pass `activePath` dari setiap page. Pendekatan paling simpel: buat navbar sebagai client component kecil yang hanya menggunakan `usePathname()` dari `next/navigation`.

Keputusan: Gunakan `"use client"` di navbar karena butuh `usePathname()` untuk active link highlight. Ini satu-satunya hook yang dibutuhkan, overhead minimal.

### 0.7 Update App Layout

**File diubah**: `/src/app/layout.tsx`

Perubahan:
1. Import `Navbar` dari `@/shared/components/navbar`
2. Import `Toaster` dari `@/shared/components/ui/sonner` (setelah install shadcn sonner)
3. Update metadata: title → "Janasku", description → sesuai produk
4. Tambahkan `<Navbar />` di atas `{children}`
5. Tambahkan `<Toaster />` di bawah `{children}` (untuk toast notifications)
6. Wrap children dalam container yang tepat

```tsx
// Struktur layout baru
<html lang="id">
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <Navbar />
    <main className="min-h-[calc(100svh-3.5rem)]">
      {children}
    </main>
    <Toaster />
  </body>
</html>
```

### 0.8 Update Home Page (Redirect)

**File diubah**: `/src/app/page.tsx`

Ubah dari halaman todo menjadi redirect ke `/chat` (landing page = chat untuk pelanggan).

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/chat");
}
```

### Verifikasi Phase 0

1. `bun run build` — tidak ada error TypeScript
2. `supabase db push` atau `supabase migration up` — migrasi berhasil
3. Verifikasi di Supabase Studio: tabel `documents`, `document_chunks` ada, bucket `documents` ada
4. Verifikasi `match_documents` function ada via Supabase SQL Editor: `select * from match_documents(null, 0, 0);` (akan return empty)
5. Buka `localhost:3000` — redirect ke `/chat`, navbar tampil dengan links
6. Toast bisa dipanggil (tes manual atau via dev console)

---

## Phase 1: Knowledge Base & Dev Tools

### 1.1 Feature: Knowledge Base

#### Types

**File baru**: `/src/features/knowledge-base/types.ts`

```typescript
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
```

#### Server Actions

**File baru**: `/src/features/knowledge-base/actions/document-actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/shared/lib/supabase";
import type { Document } from "../types";

// READ: return data langsung, throw on error (pola dari getTodos)
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

// MUTATION: return { error: string | null }, tidak throw (pola dari addTodo)
export async function uploadDocument(
  formData: FormData
): Promise<{ error: string | null; documentId?: string }> {
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "File is required" };
  }

  // Validasi MIME type
  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    return { error: "Format file tidak didukung. Gunakan PDF, TXT, atau DOCX." };
  }

  // Validasi ukuran (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "Ukuran file melebihi batas 10 MB." };
  }

  // 1. Upload ke Supabase Storage
  const filePath = `${crypto.randomUUID()}-${file.name}`;
  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (storageError) {
    return { error: `Gagal mengunggah file: ${storageError.message}` };
  }

  // 2. Simpan metadata ke tabel documents
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
    // Rollback: hapus file dari storage
    await supabase.storage.from("documents").remove([filePath]);
    return { error: `Gagal menyimpan metadata: ${dbError.message}` };
  }

  revalidatePath("/knowledge-base");
  return { error: null, documentId: data.id };
}

// MUTATION
export async function deleteDocument(
  id: string
): Promise<{ error: string | null }> {
  // 1. Ambil file_path sebelum hapus
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (fetchError || !doc) {
    return { error: "Dokumen tidak ditemukan" };
  }

  // 2. Hapus file dari Storage
  await supabase.storage.from("documents").remove([doc.file_path]);

  // 3. Hapus dari DB (chunks otomatis cascade)
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return { error: `Gagal menghapus dokumen: ${error.message}` };
  }

  revalidatePath("/knowledge-base");
  return { error: null };
}
```

#### Components

**Hierarki komponen**:
```
KnowledgeBasePage (Server Component - page.tsx)
  └─ DropZone ("use client" - drag & drop + file picker)
  └─ FileList (Server Component - menerima documents props)
       └─ FileItem ("use client" - per-item, tombol hapus + status)
            └─ DeleteDialog ("use client" - modal konfirmasi)
```

**File baru**: `/src/features/knowledge-base/components/drop-zone.tsx`

```typescript
"use client";

// Props
type DropZoneProps = {
  // Tidak ada props — self-contained upload logic
};

// Hooks: useState (isDragging), useTransition (isPending)
// Events: onDragOver, onDragLeave, onDrop, onChange (hidden file input)
// Action: uploadDocument(formData) lalu revalidate
// UI: Lucide icons (FileUpIcon, UploadCloudIcon)
// Toast: import { toast } from "sonner" untuk notifikasi sukses/error
// Validasi client-side: format file + ukuran sebelum kirim ke server
```

Perilaku dari wireframe:
- Default: border dashed dengan warna muted, ikon folder, teks "Drag & drop file ke sini"
- Drag active: border solid warna primary, background primary/5%, teks "Lepaskan file di sini!"
- Klik area → trigger hidden `<input type="file" accept=".pdf,.txt,.docx" />`
- Setelah upload berhasil → toast sukses "File berhasil diunggah"
- Jika format salah → toast error "Format file tidak didukung"

**File baru**: `/src/features/knowledge-base/components/file-list.tsx`

```typescript
// Server Component (default, tanpa "use client")
import type { Document } from "../types";

type FileListProps = {
  documents: Document[];
};

// Menampilkan header "File Diunggah (N file)" + daftar FileItem
// Jika kosong: tampilkan empty state message
// Diurutkan dari terbaru (sudah di-handle oleh getDocuments ORDER BY)
```

**File baru**: `/src/features/knowledge-base/components/file-item.tsx`

```typescript
"use client";

import type { Document } from "../types";

type FileItemProps = {
  document: Document;
};

// Hooks: useTransition (untuk delete)
// Menampilkan: filename, size (formatted), date, status badge
// Status badge menggunakan shadcn Badge:
//   - "ready" → variant default, warna hijau
//   - "processing" → variant secondary, warna kuning + Progress bar
//   - "uploading" → variant secondary, warna biru
//   - "error" → variant destructive + error_message
// Tombol hapus (Trash2Icon): hanya muncul jika status "ready" atau "error"
// Tombol "Coba Lagi": hanya muncul jika status "error"
// Klik hapus → buka DeleteDialog
```

**File baru**: `/src/features/knowledge-base/components/delete-dialog.tsx`

```typescript
"use client";

type DeleteDialogProps = {
  documentId: string;
  filename: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Menggunakan shadcn AlertDialog
// Judul: "Hapus File?"
// Deskripsi: "{filename} akan dihapus dari knowledge base. Chatbot tidak bisa lagi merujuk file ini."
// Actions: [Batal] (secondary) + [Hapus] (destructive)
// Klik Hapus → deleteDocument(id), toast, close dialog
```

#### Barrel Export

**File baru**: `/src/features/knowledge-base/index.ts`

```typescript
export { DropZone } from "./components/drop-zone";
export { FileList } from "./components/file-list";
export { getDocuments } from "./actions/document-actions";
export type { Document, DocumentStatus } from "./types";
```

#### Page

**File baru**: `/src/app/knowledge-base/page.tsx`

```typescript
// Thin Server Component (< 30 baris, pola dari page.tsx existing)
import { getDocuments, DropZone, FileList } from "@/features/knowledge-base";

export default async function KnowledgeBasePage() {
  const documents = await getDocuments();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Knowledge Base</h1>
      <p className="mt-1 text-muted-foreground">
        Kelola dokumen yang menjadi sumber pengetahuan chatbot.
      </p>
      <div className="mt-6">
        <DropZone />
      </div>
      <div className="mt-8">
        <FileList documents={documents} />
      </div>
    </div>
  );
}
```

### 1.2 Feature: Dev Tools

#### Types

**File baru**: `/src/features/dev-tools/types.ts`

```typescript
export type UsageStats = {
  document_count: number;
  chunk_count: number;
  storage_used_bytes: number;
};
```

#### Server Actions

**File baru**: `/src/features/dev-tools/actions/dev-tools-actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/shared/lib/supabase";
import type { UsageStats } from "../types";

// READ: return data langsung, throw on error
export async function getUsageStats(): Promise<UsageStats> {
  // Hitung dokumen
  const { count: docCount, error: docError } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  if (docError) throw new Error(`Failed to count documents: ${docError.message}`);

  // Hitung chunks
  const { count: chunkCount, error: chunkError } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true });

  if (chunkError) throw new Error(`Failed to count chunks: ${chunkError.message}`);

  // Hitung total storage dari kolom file_size di documents
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

// MUTATION: return { error: string | null }
export async function resetAllData(): Promise<{ error: string | null }> {
  // 1. Ambil semua file_path untuk hapus dari Storage
  const { data: docs } = await supabase
    .from("documents")
    .select("file_path");

  // 2. Hapus semua file dari Storage bucket
  if (docs && docs.length > 0) {
    const filePaths = docs.map((d) => d.file_path);
    await supabase.storage.from("documents").remove(filePaths);
  }

  // 3. Hapus semua document_chunks (akan cascade dari documents juga, tapi explicit lebih aman)
  const { error: chunkError } = await supabase
    .from("document_chunks")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all trick

  if (chunkError) return { error: `Gagal menghapus chunks: ${chunkError.message}` };

  // 4. Hapus semua documents
  const { error: docError } = await supabase
    .from("documents")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all trick

  if (docError) return { error: `Gagal menghapus dokumen: ${docError.message}` };

  revalidatePath("/dev-tools");
  revalidatePath("/knowledge-base");
  return { error: null };
}
```

**Catatan penting**: Supabase client tidak mendukung `.delete()` tanpa filter (untuk safety). Trick `.neq("id", "00000000-...")` menghapus semua row karena tidak ada row dengan UUID tersebut, jadi filter selalu true. Alternatif yang lebih bersih: gunakan raw SQL via `supabase.rpc()` jika dibutuhkan.

#### Components

**File baru**: `/src/features/dev-tools/components/usage-stats.tsx`

```typescript
// Server Component
import type { UsageStats } from "../types";

type UsageStatsProps = {
  stats: UsageStats;
};

// Menampilkan 3 stat cards:
// - Jumlah Dokumen (FileTextIcon)
// - Jumlah Chunks (LayersIcon)
// - Storage Terpakai (HardDriveIcon) — format: KB/MB
// Menggunakan shadcn Card
```

**File baru**: `/src/features/dev-tools/components/reset-data-button.tsx`

```typescript
"use client";

type ResetDataButtonProps = {
  // Tidak ada props
};

// State: showDialog (boolean)
// Klik tombol → buka ConfirmResetDialog
// Tombol warna destructive, ikon Trash2Icon, teks "Reset Semua Data"
```

**File baru**: `/src/features/dev-tools/components/confirm-reset-dialog.tsx`

```typescript
"use client";

type ConfirmResetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Menggunakan shadcn AlertDialog
// Peringatan keras: "Aksi ini tidak dapat dibatalkan"
// Deskripsi: "Semua dokumen, chunks, dan file storage akan dihapus permanen."
// Actions: [Batal] + [Ya, Hapus Semua] (destructive)
// Klik konfirmasi → resetAllData(), toast sukses
```

#### Barrel Export

**File baru**: `/src/features/dev-tools/index.ts`

```typescript
export { UsageStatsDisplay } from "./components/usage-stats";
export { ResetDataButton } from "./components/reset-data-button";
export { getUsageStats } from "./actions/dev-tools-actions";
export type { UsageStats } from "./types";
```

#### Page

**File baru**: `/src/app/dev-tools/page.tsx`

```typescript
import { getUsageStats, UsageStatsDisplay, ResetDataButton } from "@/features/dev-tools";

export default async function DevToolsPage() {
  const stats = await getUsageStats();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Dev Tools</h1>
      <p className="mt-1 text-muted-foreground">
        Alat pengembangan untuk mengelola data aplikasi.
      </p>
      <div className="mt-6">
        <UsageStatsDisplay stats={stats} />
      </div>
      <div className="mt-8">
        <ResetDataButton />
      </div>
    </div>
  );
}
```

**Catatan Navbar**: Halaman dev-tools TIDAK ditampilkan di navbar utama. Diakses langsung via URL `/dev-tools`. Ini sesuai wireframe yang hanya menampilkan "Knowledge Base" dan "Chatbot" di navigasi.

### Verifikasi Phase 1

1. Buka `/knowledge-base` — drop zone tampil, empty state tampil
2. Upload file PDF — file muncul di daftar dengan status "uploading"
3. Upload file .xlsx — toast error "Format tidak didukung"
4. Klik hapus pada file — dialog konfirmasi muncul, klik Hapus → file hilang dari daftar + toast sukses
5. Buka `/dev-tools` — stat cards tampil (0 documents, 0 chunks, 0 bytes)
6. Upload beberapa file via KB → kembali ke dev-tools → stats terupdate
7. Klik Reset Semua Data → konfirmasi → semua data hilang, KB kosong, stats kembali ke 0
8. Verifikasi di Supabase Studio: tabel kosong, Storage bucket kosong

---

## Phase 2: Pipeline Pemrosesan Dokumen

### 2.1 PDF Extractor

**File baru**: `/src/features/knowledge-base/lib/pdf-extractor.ts`

```typescript
import pdf from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}
```

Fungsi ini sederhana karena pdf-parse sudah handle semua kompleksitas parsing. Untuk TXT, cukup `buffer.toString("utf-8")`. DOCX tidak di-support di MVP awal (bisa ditambahkan nanti dengan `mammoth`). Jika ingin support DOCX di MVP, tambahkan `bun add mammoth`.

**Keputusan MVP**: Support PDF dan TXT terlebih dahulu. DOCX bisa ditambahkan nanti. Ini mengikuti prinsip YAGNI — mulai dari format yang paling umum dan mudah.

### 2.2 Text Chunker

**File baru**: `/src/features/knowledge-base/lib/chunker.ts`

```typescript
export type TextChunk = {
  content: string;
  chunkIndex: number;
  metadata: {
    charStart: number;
    charEnd: number;
  };
};

export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const content = text.slice(start, end).trim();

    if (content.length > 0) {
      chunks.push({
        content,
        chunkIndex: index,
        metadata: { charStart: start, charEnd: end },
      });
      index++;
    }

    start += chunkSize - overlap;
  }

  return chunks;
}
```

Parameter: 1000 karakter per chunk, 200 karakter overlap. Bisa disesuaikan berdasarkan pengujian dokumen nyata.

### 2.3 Process Document Orchestrator

**File baru**: `/src/features/knowledge-base/lib/process-document.ts`

```typescript
import { supabase } from "@/shared/lib/supabase";
import { embedManyTexts } from "@/shared/lib/gemini";
import { extractTextFromPdf } from "./pdf-extractor";
import { splitTextIntoChunks } from "./chunker";

export async function processDocument(documentId: string): Promise<void> {
  try {
    // 1. Update status → "processing"
    await supabase
      .from("documents")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", documentId);

    // 2. Ambil metadata dokumen
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("file_path, mime_type, filename")
      .eq("id", documentId)
      .single();

    if (docError || !doc) throw new Error("Document not found");

    // 3. Download file dari Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(doc.file_path);

    if (downloadError || !fileData) throw new Error("Failed to download file");

    // 4. Ekstrak teks berdasarkan MIME type
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

    // 5. Potong teks menjadi chunks
    const chunks = splitTextIntoChunks(text);

    // 6. Generate embeddings untuk semua chunks (batch via direct API)
    const embeddings = await embedManyTexts(
      chunks.map((chunk) => chunk.content)
    );

    // 7. Simpan chunks + embeddings ke DB
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

    // 8. Update document status → "ready"
    await supabase
      .from("documents")
      .update({
        status: "ready",
        chunk_count: chunks.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

  } catch (error) {
    // Update status → "error" dengan pesan error
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
```

### 2.4 Integrasi ke Upload Flow

**File diubah**: `/src/features/knowledge-base/actions/document-actions.ts`

Setelah `uploadDocument()` berhasil menyimpan metadata dan mendapat `documentId`, panggil `processDocument()` secara **fire-and-forget** agar response ke client tidak menunggu processing selesai:

```typescript
// Di akhir uploadDocument(), sebelum return:
// Fire-and-forget — tidak await
processDocument(data.id).catch(console.error);

revalidatePath("/knowledge-base");
return { error: null, documentId: data.id };
```

**Mengapa fire-and-forget**: Processing bisa memakan waktu 5-30 detik tergantung ukuran file. Client mendapat response cepat dengan status "uploading", lalu UI bisa polling/revalidate untuk melihat status berubah ke "processing" → "ready".

**Catatan tentang polling**: Untuk MVP, pendekatan paling sederhana adalah: setelah upload, client melakukan `router.refresh()` secara periodik (misalnya setiap 3 detik) untuk mengecek status terbaru. Atau gunakan `useEffect` + `setInterval` yang memanggil `getDocuments()` ulang. Ini lebih sederhana daripada mengimplementasikan WebSocket/SSE untuk status updates.

### Verifikasi Phase 2

1. Upload file PDF nyata (dokumen Janasku atau PDF apapun dengan teks)
2. Verifikasi status berubah: "uploading" → "processing" → "ready"
3. Cek di Supabase Studio:
   - Tabel `document_chunks` memiliki row baru
   - Kolom `embedding` terisi (array float)
   - Kolom `content` berisi teks yang relevan
4. Cek `documents.chunk_count` sesuai jumlah chunks
5. Upload file TXT — sama, verifikasi chunks tercipta
6. Upload file kosong/corrupt — status "error" dengan pesan yang jelas
7. Dev Tools stats terupdate setelah processing selesai

---

## Phase 3: Fitur Chat

### 3.1 Chat Library Files

**File baru**: `/src/features/chat/lib/embeddings.ts`

```typescript
import { embedText } from "@/shared/lib/gemini";

export async function embedQuery(query: string): Promise<number[]> {
  return embedText(query);
}
```

**File baru**: `/src/features/chat/lib/vector-search.ts`

```typescript
import { supabase } from "@/shared/lib/supabase";

export type SearchResult = {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, unknown>;
  similarity: number;
  filename: string;
};

export async function searchDocuments(
  queryEmbedding: number[],
  threshold: number = 0.7,
  count: number = 5
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: threshold,
    match_count: count,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return data ?? [];
}
```

**File baru**: `/src/features/chat/lib/rag-context.ts`

```typescript
import type { SearchResult } from "./vector-search";

export type SourceReference = {
  filename: string;
  chunkIndex: number;
};

export function buildRagContext(results: SearchResult[]): {
  contextText: string;
  sources: SourceReference[];
} {
  if (results.length === 0) {
    return { contextText: "", sources: [] };
  }

  // Deduplicate sumber berdasarkan filename
  const sourceMap = new Map<string, SourceReference>();

  const contextParts = results.map((r, i) => {
    if (!sourceMap.has(r.filename)) {
      sourceMap.set(r.filename, {
        filename: r.filename,
        chunkIndex: r.chunk_index,
      });
    }
    return `[Dokumen: ${r.filename}, Bagian ${r.chunk_index + 1}]\n${r.content}`;
  });

  return {
    contextText: contextParts.join("\n\n---\n\n"),
    sources: Array.from(sourceMap.values()),
  };
}
```

**File baru**: `/src/features/chat/lib/system-prompt.ts`

```typescript
export function getSystemPrompt(context: string): string {
  const basePrompt = `Kamu adalah Chatbot Janasku, asisten cerdas yang menjawab pertanyaan pelanggan tentang produk Janasku.

ATURAN:
1. Jawab HANYA berdasarkan konteks dokumen yang diberikan di bawah.
2. Jika informasi tidak tersedia di konteks, jawab dengan jujur: "Maaf, saya belum memiliki informasi tentang hal tersebut di Knowledge Base kami."
3. Gunakan bahasa Indonesia yang ramah dan mudah dipahami.
4. Jangan mengarang atau berasumsi informasi yang tidak ada di konteks.
5. Jika diminta, sebutkan sumber dokumen yang menjadi referensi jawabanmu.
6. Jawab secara ringkas tapi lengkap.`;

  if (!context) {
    return `${basePrompt}\n\nTidak ada dokumen di Knowledge Base saat ini. Informasikan kepada pelanggan bahwa Knowledge Base belum memiliki dokumen.`;
  }

  return `${basePrompt}\n\nKONTEKS DOKUMEN:\n${context}`;
}
```

### 3.2 Types

**File baru**: `/src/features/chat/types.ts`

```typescript
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
```

> **Catatan**: Tipe `ChatMessage` didefinisikan sendiri, tanpa dependency ke `UIMessage` dari AI SDK. Sederhana dan sesuai kebutuhan.

### 3.3 API Route (Chat Endpoint)

**File baru**: `/src/app/api/chat/route.ts`

Ini adalah SATU-SATUNYA exception dari pola "Server Actions only" — chat membutuhkan streaming via POST handler. Menggunakan direct SSE (Server-Sent Events) tanpa AI SDK.

```typescript
import { streamChat } from "@/shared/lib/gemini";
import { embedQuery } from "@/features/chat/lib/embeddings";
import { searchDocuments } from "@/features/chat/lib/vector-search";
import { buildRagContext } from "@/features/chat/lib/rag-context";
import { getSystemPrompt } from "@/features/chat/lib/system-prompt";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastUserMessage = messages
    .filter((m: { role: string }) => m.role === "user")
    .pop();

  if (!lastUserMessage) {
    return new Response("No user message found", { status: 400 });
  }

  // RAG Pipeline
  const queryText = lastUserMessage.text ?? lastUserMessage.content ?? "";
  const queryEmbedding = await embedQuery(queryText);
  const searchResults = await searchDocuments(queryEmbedding);
  const { contextText, sources } = buildRagContext(searchResults);
  const systemPrompt = getSystemPrompt(contextText);

  // Convert ke format Gemini
  const geminiMessages = messages.map(
    (m: { role: string; text?: string; content?: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text ?? m.content ?? "" }],
    })
  );

  // Stream dari Gemini, lalu forward ke client sebagai SSE
  const textStream = streamChat(geminiMessages, systemPrompt);
  const reader = textStream.getReader();

  const sseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "text", text: value })}\n\n`)
          );
        }
        // Kirim sources saat selesai
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "finish", sources })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(sseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Protokol SSE**: Client menerima 3 tipe event:
- `{"type":"text","text":"..."}` — chunk teks dari Gemini
- `{"type":"finish","sources":[...]}` — sources dikirim setelah streaming selesai
- `{"type":"error","message":"..."}` — error handling
- `[DONE]` — sinyal stream selesai

### 3.4 Chat Components

**Hierarki komponen**:
```
ChatPage (Server Component - page.tsx)
  └─ ChatContainer ("use client" - useChat hook, main orchestrator)
       ├─ WelcomeState (tampil saat messages kosong)
       │    └─ Suggestion chips (clickable)
       ├─ ScrollArea (area pesan, scrollable)
       │    ├─ ChatBubble (per message, user atau bot)
       │    │    └─ SourceBlock (muncul di bawah bot message jika ada sources)
       │    ├─ TypingIndicator (saat isLoading)
       │    └─ ErrorMessage (saat error)
       └─ ChatInput (form input + tombol kirim)
```

**File baru**: `/src/features/chat/hooks/use-chat.ts`

Custom hook menggantikan `@ai-sdk/react`'s `useChat`. Mengelola state messages, mengirim ke `/api/chat`, membaca SSE stream, dan mengekstrak sources dari event `finish`.

```typescript
"use client";

export function useChat(): {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  status: "idle" | "submitted" | "streaming";
  error: Error | null;
  regenerate: () => void;
}
```

Implementasi: `useState` untuk messages/status/error, `fetch` + `ReadableStream` untuk SSE parsing, `regenerate` menghapus pesan assistant terakhir dan mengirim ulang.

**File baru**: `/src/features/chat/components/chat-container.tsx`

```typescript
"use client";

import { useChat } from "../hooks/use-chat";

// Tidak ada props — self-contained
// Hook: useChat() dari custom hook (bukan @ai-sdk/react)
// Conditional render:
//   - messages.length === 0 → <WelcomeState onSuggestionClick={...} />
//   - messages.length > 0 → map messages ke <ChatBubble />
//   - status === "submitted" → <TypingIndicator />
//   - error → <ErrorMessage onRetry={regenerate} />
// Auto-scroll: useRef pada scroll container, scroll ke bawah saat messages berubah
```

**File baru**: `/src/features/chat/components/welcome-state.tsx`

```typescript
type WelcomeStateProps = {
  onSuggestionClick: (text: string) => void;
};

// Sesuai wireframe high-fidelity:
// - Ikon bot (BotIcon dari Lucide, di dalam circle background kuning/secondary)
// - Heading: "Halo! Saya Chatbot Janasku."
// - Subtext: "Saya siap membantu menjawab pertanyaan seputar produk kami berdasarkan dokumen Knowledge Base."
// - 4-5 suggestion chips (clickable):
//   - "Janasku terbuat dari apa?"
//   - "Bagaimana cara minum Janasku?"
//   - "Apakah aman untuk ibu hamil?"
//   - "Berapa harganya?"
// Suggestion chips: border rounded-lg, klik → onSuggestionClick(text)
// Sparkles icon (SparklesIcon dari Lucide) di kiri setiap chip
```

**File baru**: `/src/features/chat/components/chat-bubble.tsx`

```typescript
import type { ChatMessage } from "../types";

type ChatBubbleProps = {
  message: ChatMessage;
};

// User bubble:
//   - Rata kanan (flex justify-end)
//   - Background primary (kunyit), text primary-foreground
//   - Rounded corners (rounded-lg rounded-tr-sm)
//
// Bot bubble:
//   - Rata kiri (flex justify-start)
//   - Background muted, text foreground
//   - Rounded corners (rounded-lg rounded-tl-sm)
//   - Tampilkan message.text langsung (bukan parts array)
//   - Jika message.sources ada → render <SourceBlock />
//   - Untuk MVP: gunakan `whitespace-pre-wrap` dan simple formatting
```

**File baru**: `/src/features/chat/components/source-block.tsx`

```typescript
import type { ChatSource } from "../types";

type SourceBlockProps = {
  sources: ChatSource[];
};

// Compact card di bawah bot message:
// - Border muted, background card, rounded-md
// - Icon PaperclipIcon dari Lucide
// - Label "Sumber Referensi:"
// - List nama file (deduplicated)
// Sesuai wireframe: blok terpisah di dalam bot bubble
```

**File baru**: `/src/features/chat/components/chat-input.tsx`

```typescript
type ChatInputProps = {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
};

// Form dengan:
// - Input field (placeholder "Ketik pertanyaan Anda di sini...")
// - Tombol kirim (SendIcon dari Lucide)
//   - Disabled saat input kosong atau isLoading
//   - Saat isLoading: tampilkan Loader2Icon (spinning)
// - Submit via Enter atau klik tombol
// Sticky di bagian bawah (sticky bottom-0)
// Background sama dengan page background
```

**File baru**: `/src/features/chat/components/typing-indicator.tsx`

```typescript
type TypingIndicatorProps = {
  // Tidak ada props
};

// 3 dots animation (bounce)
// Tampil di posisi bot message (rata kiri)
// Animasi CSS: 3 div bulat dengan animation-delay berbeda
// Menggunakan tw-animate-css classes atau custom keyframes
```

**File baru**: `/src/features/chat/components/error-message.tsx`

```typescript
type ErrorMessageProps = {
  onRetry: () => void;
};

// Inline block di area chat:
// - Background destructive/10%, border destructive/20%
// - Icon AlertCircleIcon dari Lucide
// - Text: "Gagal mendapat jawaban. Silakan coba lagi."
// - Tombol "Coba Lagi" (variant outline, size sm)
// - Klik Coba Lagi → onRetry (dari useChat reload)
```

#### Barrel Export

**File baru**: `/src/features/chat/index.ts`

```typescript
export { ChatContainer } from "./components/chat-container";
export type { ChatMessage, ChatSource } from "./types";
```

#### Page

**File baru**: `/src/app/chat/page.tsx`

```typescript
import { ChatContainer } from "@/features/chat";

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">
      <ChatContainer />
    </div>
  );
}
```

**Catatan**: Chat page adalah Client Component (karena ChatContainer menggunakan useChat), tapi page.tsx sendiri tetap Server Component yang hanya render ChatContainer. Tidak ada data fetching di page level untuk chat — semua interaktivitas di client.

### 3.5 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT (Browser)                                             │
│                                                              │
│  ChatContainer (custom useChat hook)                         │
│    │                                                         │
│    ├─ User types message + submit                            │
│    │    └─ POST /api/chat { messages: [...] }               │
│    │                                                         │
│    └─ Reads SSE stream via fetch + ReadableStream            │
│         ├─ {type:"text"} → append text to assistant message  │
│         └─ {type:"finish"} → attach sources to message       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ SERVER (API Route: /api/chat)                                │
│                                                              │
│  1. Parse last user message from messages array              │
│  2. embedQuery(lastMessage) → float[768]    ←── Gemini HTTPS│
│  3. searchDocuments(embedding) → top 5 chunks   ←── pgvector│
│  4. buildRagContext(chunks) → contextText + sources          │
│  5. getSystemPrompt(contextText) → full prompt               │
│  6. streamChat(messages, system) → stream   ←── Gemini HTTPS│
│  7. Forward as SSE: text chunks + finish with sources        │
└─────────────────────────────────────────────────────────────┘
```

### Verifikasi Phase 3

1. Pastikan ada dokumen "ready" di Knowledge Base (dari Phase 2)
2. Buka `/chat` — welcome state tampil dengan suggestion chips
3. Klik suggestion chip — pertanyaan terisi dan terkirim
4. Bot menjawab dengan streaming (teks muncul bertahap)
5. Source block muncul di bawah jawaban bot (nama file yang relevan)
6. Tanya sesuatu di luar knowledge base — bot menjawab jujur "belum memiliki informasi"
7. Disconnect internet/matikan Supabase → error message tampil dengan tombol "Coba Lagi"
8. Typing indicator muncul saat bot memproses
9. Input disabled saat bot sedang menjawab
10. Auto-scroll ke bawah saat pesan baru muncul
11. Multiple round conversation — context terjaga

---

## Phase 4: Polish

### 4.1 Animasi & Micro-interactions

Mengikuti panduan dari dokumen sistem desain (`05_sistem_desain_tema_dan_warna.md`):

- **Chat bubble fade-in**: Tambahkan class `animate-in fade-in slide-in-from-bottom-2` dari tw-animate-css pada setiap bubble baru
- **Typing indicator bounce**: 3 dots dengan `animate-bounce` dan `animation-delay` berbeda
- **Drop zone hover**: `transition-colors duration-200` pada border dan background
- **Button hover**: sudah di-handle oleh shadcn button variants
- **Toast animations**: sudah di-handle oleh sonner

### 4.2 Responsive Design

- **Mobile**: Stack layout, chat input sticky di bawah, knowledge base full-width
- **Tablet**: Sama dengan desktop tapi dengan padding dikurangi
- **Desktop**: max-w-3xl centered untuk KB, full height untuk chat

### 4.3 Error Handling Edge Cases

- **Empty PDF**: Tampilkan pesan "Dokumen tidak mengandung teks"
- **Network timeout saat upload**: Toast error + file tidak muncul di daftar
- **Gemini API rate limit**: Catch error, tampilkan pesan user-friendly
- **Concurrent uploads**: Setiap upload independen, status tracking per-file
- **Very large file**: Validasi client-side 10MB sebelum upload ke server

### 4.4 Loading States

- Knowledge Base page: Suspense boundary atau loading.tsx
- Dev Tools stats: Skeleton cards saat loading
- Chat: Typing indicator saat streaming
- File upload: Progress indication (status badge berubah)

### 4.5 Accessibility

- Semua tombol memiliki aria-label yang deskriptif
- Chat input memiliki label yang proper
- Dialog memiliki role dan aria attributes (sudah di-handle shadcn AlertDialog)
- Color contrast memenuhi WCAG 2.1 AA (OKLCH values sudah didesain untuk ini)

### Verifikasi Phase 4

1. **Responsive**: Tes di viewport 375px (mobile), 768px (tablet), 1280px (desktop)
2. **Error recovery**: Matikan/nyalakan koneksi saat upload dan chat
3. **Performance**: Upload file 5MB — harus selesai dalam < 30 detik
4. **Chat performance**: Jawaban mulai streaming dalam < 5 detik
5. **Animations**: Semua transisi smooth, tidak janky
6. **Empty states**: Semua halaman memiliki empty state yang informatif

---

## Ringkasan File yang Dibuat/Diubah

### File Baru (37 file)

```
supabase/migrations/<timestamp>_create_rag_infrastructure.sql

src/shared/lib/gemini.ts
src/shared/components/navbar.tsx

src/features/knowledge-base/types.ts
src/features/knowledge-base/index.ts
src/features/knowledge-base/actions/document-actions.ts
src/features/knowledge-base/components/drop-zone.tsx
src/features/knowledge-base/components/file-list.tsx
src/features/knowledge-base/components/file-item.tsx
src/features/knowledge-base/components/delete-dialog.tsx
src/features/knowledge-base/lib/pdf-extractor.ts
src/features/knowledge-base/lib/chunker.ts
src/features/knowledge-base/lib/process-document.ts

src/features/dev-tools/types.ts
src/features/dev-tools/index.ts
src/features/dev-tools/actions/dev-tools-actions.ts
src/features/dev-tools/components/usage-stats.tsx
src/features/dev-tools/components/reset-data-button.tsx
src/features/dev-tools/components/confirm-reset-dialog.tsx

src/features/chat/types.ts
src/features/chat/index.ts
src/features/chat/components/chat-container.tsx
src/features/chat/components/chat-bubble.tsx
src/features/chat/components/chat-input.tsx
src/features/chat/components/welcome-state.tsx
src/features/chat/components/source-block.tsx
src/features/chat/components/typing-indicator.tsx
src/features/chat/components/error-message.tsx
src/features/chat/hooks/use-chat.ts
src/features/chat/lib/embeddings.ts
src/features/chat/lib/vector-search.ts
src/features/chat/lib/rag-context.ts
src/features/chat/lib/system-prompt.ts

src/app/knowledge-base/page.tsx
src/app/chat/page.tsx
src/app/dev-tools/page.tsx
src/app/api/chat/route.ts
```

### File Diubah (4 file)

```
next.config.ts          (tambah serverExternalPackages)
src/app/layout.tsx      (tambah Navbar + Toaster + metadata)
src/app/page.tsx        (ubah ke redirect /chat)
.env.example            (tambah GOOGLE_GENERATIVE_AI_API_KEY)
```

### Dependencies Baru

```
Production: pdf-parse
Dev: @types/pdf-parse
shadcn: dialog, badge, sonner, scroll-area, alert-dialog, dropdown-menu, separator, progress
```

> **Catatan**: Tidak ada dependency AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react`, `@google/genai`). Semua integrasi Gemini menggunakan direct HTTPS API call via `fetch()` bawaan Node.js/browser.

---

# Technical Implementation Plan — Janasku RAG Chatbot MVP

This document is a step-by-step implementation guide based on decisions made in the brainstorming document (06_A). Each phase contains: files to create/modify with exact paths, SQL migrations, function signatures, component props interfaces, code patterns to follow, and verification tests.

**Reference Conventions** (from existing todo feature):
- Server Actions: `"use server"` on first line, import supabase from `@/shared/lib/supabase`
- Read actions: return data directly, `throw new Error(...)` on failure
- Mutation actions: return `{ error: string | null }`, never throw
- Cache invalidation: `revalidatePath("/path")` after mutations
- Types: hand-written in `features/<name>/types.ts`, no generated DB types
- Barrel exports: only public API exported from `index.ts`
- Pages: thin async Server Components (< 30 lines), fetch data then pass as props
- Components: server by default, `"use client"` only when hooks/events needed
- Dependency rule: `app -> features -> shared` (features NEVER import other features)
- Path alias: `@/*` maps to `src/*`

---

## Phase 0: Foundation

### 0.1 Install Dependencies

```bash
# PDF parsing
bun add pdf-parse
bun add -D @types/pdf-parse

# shadcn components (auto-installed to src/shared/components/ui/)
bunx shadcn@latest add dialog badge sonner scroll-area alert-dialog dropdown-menu separator progress
```

> **Note**: No AI SDK dependencies. Gemini integration uses direct HTTPS API calls via `fetch()` — more stable, no SDK serialization bugs, and easy to debug.

### 0.2 Environment Variables

**File modified**: `/.env.local` (add lines), `/.env.example` (add lines)

```env
# Existing
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# New
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### 0.3 Next.js Config — Server External Packages

**File modified**: `/next.config.ts`

`pdf-parse` uses Node.js features (`fs`, `path`) that are incompatible with Next.js bundling. Must be added to `serverExternalPackages`.

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
```

### 0.4 Supabase Migrations

**New file**: `/supabase/migrations/<timestamp>_create_rag_infrastructure.sql`

Timestamp naming follows existing pattern (`20260227092516_create_todos_table.sql`), e.g., `20260228100000_create_rag_infrastructure.sql`.

```sql
-- 1. Enable pgvector extension
create extension if not exists vector with schema extensions;

-- 2. Documents table (uploaded file metadata)
create table documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_size integer not null,
  file_path text not null,
  mime_type text not null,
  status text not null default 'uploading'
    check (status in ('uploading', 'processing', 'ready', 'error')),
  error_message text,
  chunk_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;
create policy "Allow all operations on documents"
  on documents for all using (true) with check (true);

-- 3. Document chunks table (text chunks + vector embeddings)
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  embedding vector(768),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table document_chunks enable row level security;
create policy "Allow all operations on document_chunks"
  on document_chunks for all using (true) with check (true);

-- Index for vector search (cosine distance)
create index on document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Similarity search function (RPC)
create or replace function match_documents(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  metadata jsonb,
  similarity float,
  filename text
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.filename
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where d.status = 'ready'
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 5. Storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Policies: allow all operations on documents bucket (MVP without auth)
create policy "Allow all uploads to documents bucket"
  on storage.objects for insert
  with check (bucket_id = 'documents');

create policy "Allow all reads from documents bucket"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Allow all deletes from documents bucket"
  on storage.objects for delete
  using (bucket_id = 'documents');
```

**Important note about IVFFlat index**: The `ivfflat` index requires at least some rows of data to be effective. For an MVP with few documents this will still work. If the list count (100) is too large for small data, PostgreSQL will fallback to sequential scan which is fast for small datasets anyway.

### 0.5 Shared Gemini Client (Direct HTTPS API)

**New file**: `/src/shared/lib/gemini.ts`

Uses direct `fetch()` calls to Gemini REST API. Exports:
- `embedText(text)` — single embedding via `embedContent` endpoint
- `embedManyTexts(texts)` — batch embeddings via `Promise.all`
- `streamChat(messages, systemPrompt)` — streaming chat via `streamGenerateContent?alt=sse`

**Models**: Chat uses `gemini-3-flash-preview`, embeddings use `gemini-embedding-001` (768 dimensions). API key read from `GOOGLE_GENERATIVE_AI_API_KEY` env var, passed via `x-goog-api-key` header.

**Why direct HTTPS, not AI SDK**: `@ai-sdk/google` and `@google/genai` have serialization bugs on embedding requests (sending `parts: [{}]` to the API, causing `required oneof field 'data' must have one initialized field` error). Direct fetch is more stable, easier to debug, and has zero dependencies.

**Why shared**: This module is used by two different features (knowledge-base for document processing, chat for query embedding). Being in `shared/lib/`, both features can import it without violating the dependency rule.

### 0.6 Shared Navbar Component

**New file**: `/src/shared/components/navbar.tsx`

```typescript
// Uses "use client" because it needs usePathname() for active link highlighting
// Props: none — reads pathname from next/navigation hook

// Structure per high-fidelity wireframe:
// - Left: "Janasku" logo text in primary color + bot icon
// - Right: "Knowledge Base" link, "Chatbot" link
// - Active link: border-primary background, text-primary
// - Bottom border: orange line (border-b with primary color)
```

### 0.7 Update App Layout

**File modified**: `/src/app/layout.tsx`

Changes:
1. Import `Navbar` from `@/shared/components/navbar`
2. Import `Toaster` from `@/shared/components/ui/sonner` (after installing shadcn sonner)
3. Update metadata: title to "Janasku", description to match product
4. Add `<Navbar />` above `{children}`
5. Add `<Toaster />` below `{children}` (for toast notifications)
6. Wrap children in appropriate container

```tsx
// New layout structure
<html lang="id">
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <Navbar />
    <main className="min-h-[calc(100svh-3.5rem)]">
      {children}
    </main>
    <Toaster />
  </body>
</html>
```

### 0.8 Update Home Page (Redirect)

**File modified**: `/src/app/page.tsx`

Change from todo page to redirect to `/chat` (landing page = chat for customers).

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/chat");
}
```

### Phase 0 Verification

1. `bun run build` — no TypeScript errors
2. `supabase db push` or `supabase migration up` — migration succeeds
3. Verify in Supabase Studio: `documents` table, `document_chunks` table exist, `documents` bucket exists
4. Verify `match_documents` function exists via Supabase SQL Editor: `select * from match_documents(null, 0, 0);` (returns empty)
5. Open `localhost:3000` — redirects to `/chat`, navbar visible with links
6. Toast can be triggered (manual test)

---

## Phase 1: Knowledge Base & Dev Tools

### 1.1 Feature: Knowledge Base

#### Types

**New file**: `/src/features/knowledge-base/types.ts`

```typescript
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
```

#### Server Actions

**New file**: `/src/features/knowledge-base/actions/document-actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/shared/lib/supabase";
import type { Document } from "../types";

// READ: return data directly, throw on error (pattern from getTodos)
export async function getDocuments(): Promise<Document[]>
// MUTATION: return { error: string | null } (pattern from addTodo)
export async function uploadDocument(formData: FormData): Promise<{ error: string | null; documentId?: string }>
export async function deleteDocument(id: string): Promise<{ error: string | null }>
```

Full implementation details:
- `getDocuments`: SELECT * FROM documents ORDER BY created_at DESC
- `uploadDocument`: validate mime type + size, upload to Storage, insert metadata, fire-and-forget processDocument
- `deleteDocument`: fetch file_path, delete from Storage, delete from DB (chunks cascade)

#### Components

**Component hierarchy**:
```
KnowledgeBasePage (Server Component - page.tsx)
  -> DropZone ("use client" - drag & drop + file picker)
  -> FileList (Server Component - receives documents props)
       -> FileItem ("use client" - per-item, delete button + status)
            -> DeleteDialog ("use client" - confirmation modal)
```

Files:
- `/src/features/knowledge-base/components/drop-zone.tsx` — drag & drop upload area
- `/src/features/knowledge-base/components/file-list.tsx` — server component, renders list
- `/src/features/knowledge-base/components/file-item.tsx` — client component, per-file row
- `/src/features/knowledge-base/components/delete-dialog.tsx` — AlertDialog confirmation

#### Barrel Export

**New file**: `/src/features/knowledge-base/index.ts`

```typescript
export { DropZone } from "./components/drop-zone";
export { FileList } from "./components/file-list";
export { getDocuments } from "./actions/document-actions";
export type { Document, DocumentStatus } from "./types";
```

#### Page

**New file**: `/src/app/knowledge-base/page.tsx` — thin Server Component (< 30 lines)

### 1.2 Feature: Dev Tools

#### Types

**New file**: `/src/features/dev-tools/types.ts`

```typescript
export type UsageStats = {
  document_count: number;
  chunk_count: number;
  storage_used_bytes: number;
};
```

#### Server Actions

**New file**: `/src/features/dev-tools/actions/dev-tools-actions.ts`

```typescript
"use server";
export async function getUsageStats(): Promise<UsageStats>  // READ pattern
export async function resetAllData(): Promise<{ error: string | null }>  // MUTATION pattern
```

`resetAllData` must:
1. Fetch all file_paths from documents table
2. Delete all files from Storage bucket
3. Delete all document_chunks
4. Delete all documents
5. revalidatePath for both /dev-tools and /knowledge-base

#### Components

- `/src/features/dev-tools/components/usage-stats.tsx` — Server Component, 3 stat cards
- `/src/features/dev-tools/components/reset-data-button.tsx` — Client Component, trigger dialog
- `/src/features/dev-tools/components/confirm-reset-dialog.tsx` — AlertDialog with destructive warning

#### Page

**New file**: `/src/app/dev-tools/page.tsx` — thin Server Component, NOT linked in navbar (access via URL only)

### Phase 1 Verification

1. Open `/knowledge-base` — drop zone visible, empty state visible
2. Upload PDF file — file appears in list with "uploading" status
3. Upload .xlsx file — toast error "Unsupported format"
4. Click delete on file — confirmation dialog appears, confirm delete, file removed + toast
5. Open `/dev-tools` — stat cards show (0 documents, 0 chunks, 0 bytes)
6. Upload files via KB, return to dev-tools — stats updated
7. Click Reset All Data — confirm — all data cleared, KB empty, stats back to 0

---

## Phase 2: Document Processing Pipeline

### 2.1 PDF Extractor

**New file**: `/src/features/knowledge-base/lib/pdf-extractor.ts`

Simple wrapper around pdf-parse. TXT handled via `buffer.toString("utf-8")`.

### 2.2 Text Chunker

**New file**: `/src/features/knowledge-base/lib/chunker.ts`

Parameters: 1000 chars per chunk, 200 chars overlap. Returns `TextChunk[]` with content, chunkIndex, and metadata (charStart, charEnd).

### 2.3 Process Document Orchestrator

**New file**: `/src/features/knowledge-base/lib/process-document.ts`

Pipeline: update status "processing" -> download from Storage -> extract text -> chunk -> embed via `embedManyTexts()` (direct Gemini HTTPS) -> insert chunks to DB -> update status "ready". On error: update status "error" with message.

### 2.4 Integration into Upload Flow

**File modified**: `/src/features/knowledge-base/actions/document-actions.ts`

After successful metadata insert, call `processDocument(id)` as fire-and-forget (no await). Client gets immediate response, polling/refresh shows status changes.

### Phase 2 Verification

1. Upload real PDF with text content
2. Status transitions: "uploading" -> "processing" -> "ready"
3. Verify in Supabase Studio: document_chunks has rows, embedding column filled, content is relevant text
4. documents.chunk_count matches actual chunk count
5. Upload TXT file — same verification
6. Upload empty/corrupt file — status "error" with clear message

---

## Phase 3: Chat Feature

### 3.1 Chat Library Files

- `/src/features/chat/lib/embeddings.ts` — `embedQuery(query) -> number[]` (uses `embedText` from gemini.ts)
- `/src/features/chat/lib/vector-search.ts` — `searchDocuments(embedding, threshold, count) -> SearchResult[]`
- `/src/features/chat/lib/rag-context.ts` — `buildRagContext(results) -> { contextText, sources }`
- `/src/features/chat/lib/system-prompt.ts` — `getSystemPrompt(context) -> string`

### 3.2 API Route

**New file**: `/src/app/api/chat/route.ts`

The ONE exception to "Server Actions only" — needs streaming via POST handler.

RAG pipeline in POST handler:
1. Parse last user message
2. Embed query via Gemini direct HTTPS API
3. Vector search via match_documents RPC
4. Build context + sources
5. Build system prompt
6. Stream response via `streamChat()` (direct Gemini HTTPS with `?alt=sse`)
7. Forward as SSE to client: text chunks + finish event with sources

### 3.3 Chat Components

**Component hierarchy**:
```
ChatPage (Server Component)
  -> ChatContainer ("use client" - useChat hook)
       -> WelcomeState (shown when no messages)
       -> ScrollArea (message area)
       |    -> ChatBubble (per message)
       |    |    -> SourceBlock (in bot messages)
       |    -> TypingIndicator (when loading)
       |    -> ErrorMessage (on error)
       -> ChatInput (form input + send button)
```

Files:
- `/src/features/chat/hooks/use-chat.ts` — custom useChat hook (replaces `@ai-sdk/react`), SSE parsing
- `/src/features/chat/components/chat-container.tsx` — main orchestrator with custom `useChat`
- `/src/features/chat/components/welcome-state.tsx` — bot icon + greeting + suggestion chips
- `/src/features/chat/components/chat-bubble.tsx` — user (right, primary bg) / bot (left, muted bg)
- `/src/features/chat/components/source-block.tsx` — compact reference card below bot messages
- `/src/features/chat/components/chat-input.tsx` — input + send button, sticky bottom
- `/src/features/chat/components/typing-indicator.tsx` — bouncing dots animation
- `/src/features/chat/components/error-message.tsx` — inline error with retry button

### 3.4 Data Flow

```
Client (custom useChat) -> POST /api/chat -> embedQuery -> searchDocuments -> buildRagContext
  -> getSystemPrompt -> streamChat (Gemini HTTPS) -> SSE Response -> Client (SSE stream parsing)
```

### Phase 3 Verification

1. Ensure "ready" documents exist in Knowledge Base
2. Open `/chat` — welcome state with suggestion chips
3. Click suggestion — question sent, bot streams answer
4. Source block appears below bot answer
5. Ask out-of-scope question — bot answers honestly
6. Disconnect network — error message with retry button
7. Typing indicator visible during processing
8. Input disabled while bot processes
9. Auto-scroll on new messages
10. Multi-turn conversation works

---

## Phase 4: Polish

- Animations: fade-in on chat bubbles, bounce on typing indicator, transitions on drop zone
- Responsive: mobile (375px), tablet (768px), desktop (1280px)
- Error edge cases: empty PDF, network timeout, API rate limits, concurrent uploads
- Loading states: Suspense/skeleton for pages, typing indicator for chat
- Accessibility: aria-labels, proper dialog roles, WCAG AA contrast

---

## File Summary

### New Files (37 files)

```
supabase/migrations/<timestamp>_create_rag_infrastructure.sql
src/shared/lib/gemini.ts
src/shared/components/navbar.tsx
src/features/knowledge-base/types.ts
src/features/knowledge-base/index.ts
src/features/knowledge-base/actions/document-actions.ts
src/features/knowledge-base/components/drop-zone.tsx
src/features/knowledge-base/components/file-list.tsx
src/features/knowledge-base/components/file-item.tsx
src/features/knowledge-base/components/delete-dialog.tsx
src/features/knowledge-base/lib/pdf-extractor.ts
src/features/knowledge-base/lib/chunker.ts
src/features/knowledge-base/lib/process-document.ts
src/features/dev-tools/types.ts
src/features/dev-tools/index.ts
src/features/dev-tools/actions/dev-tools-actions.ts
src/features/dev-tools/components/usage-stats.tsx
src/features/dev-tools/components/reset-data-button.tsx
src/features/dev-tools/components/confirm-reset-dialog.tsx
src/features/chat/types.ts
src/features/chat/index.ts
src/features/chat/components/chat-container.tsx
src/features/chat/components/chat-bubble.tsx
src/features/chat/components/chat-input.tsx
src/features/chat/components/welcome-state.tsx
src/features/chat/components/source-block.tsx
src/features/chat/components/typing-indicator.tsx
src/features/chat/components/error-message.tsx
src/features/chat/hooks/use-chat.ts
src/features/chat/lib/embeddings.ts
src/features/chat/lib/vector-search.ts
src/features/chat/lib/rag-context.ts
src/features/chat/lib/system-prompt.ts
src/app/knowledge-base/page.tsx
src/app/chat/page.tsx
src/app/dev-tools/page.tsx
src/app/api/chat/route.ts
```

### Modified Files (4 files)

```
next.config.ts          (add serverExternalPackages)
src/app/layout.tsx      (add Navbar + Toaster + metadata)
src/app/page.tsx        (change to redirect /chat)
.env.example            (add GOOGLE_GENERATIVE_AI_API_KEY)
```

### New Dependencies

```
Production: pdf-parse
Dev: @types/pdf-parse
shadcn: dialog, badge, sonner, scroll-area, alert-dialog, dropdown-menu, separator, progress
```

> **Note**: No AI SDK dependencies (`ai`, `@ai-sdk/google`, `@ai-sdk/react`, `@google/genai`). All Gemini integration uses direct HTTPS API calls via native `fetch()`.