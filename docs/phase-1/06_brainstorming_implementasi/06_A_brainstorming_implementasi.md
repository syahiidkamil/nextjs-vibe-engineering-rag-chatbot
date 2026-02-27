# Brainstorming Implementasi — Janasku RAG Chatbot MVP

## Konteks

Setelah menyelesaikan seluruh Phase 1 discovery (masalah bisnis, BRD/PRD, wireframe, sistem desain), kita perlu merencanakan implementasi. Lingkup MVP adalah dua halaman: **Knowledge Base** (`/knowledge-base`) dan **Chat** (`/chat`), tanpa autentikasi, bahasa Indonesia.

## Bagian 1: Pemecahan Masalah/Tugas — 7 Alur Kerja

MVP dipecah menjadi **7 alur kerja** dengan dependensi yang jelas:

```
W1: Tata Letak & Navigasi Bersama
W2: Skema Database & Infrastruktur Penyimpanan
W3: Fitur Knowledge Base (Manajemen File)
W4: Pipeline Pemrosesan Dokumen
W5: Pipeline RAG (Embedding + Pencarian Vektor)
W6: Fitur Chat (UI + Integrasi LLM)
W7: Dev Tools (Reset Data & Statistik Penggunaan)
```

### Alur Dependensi

```
W1 (Tata Letak) ──┬──> W3 (Knowledge Base UI)
                   ├──> W6 (Chat UI)
                   └──> W7 (Dev Tools UI)
W2 (DB/Storage)  ──┬──> W3
                    ├──> W5 (Pipeline RAG)
                    └──> W7
W3 ──> W4 (Pemrosesan Dok) ──> W5 ──> W6
```

**W1 & W2** adalah fondasi (tanpa dependensi). **W3** butuh W1+W2. **W4** butuh W3. **W5** butuh W2+W4. **W6** butuh semuanya. **W7** butuh W1+W2 (bisa dibangun paralel dengan W3).

## Bagian 2: Keputusan Teknologi

### Yang Sudah Kita Miliki
- Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui
- Supabase (PostgreSQL + Storage + CLI lokal)
- Arsitektur berbasis fitur (`src/features/`, `src/shared/`)
- Pola Server Actions (sudah diterapkan di fitur todo)

### 8 Keputusan Utama

| # | Keputusan | Opsi | Rekomendasi |
|---|-----------|------|-------------|
| 1 | **Penyimpanan File** | Supabase Storage / S3 / Lokal | Supabase Storage (sudah ada) |
| 2 | **Ekstraksi Teks** | pdf-parse / LangChain loaders / Unstructured.io | pdf-parse (KISS, PDF saja untuk MVP) |
| 3 | **Pemotongan Teks** | Custom splitter / LangChain splitters | Custom (~50 baris kode) |
| 4 | **Embedding** | Lihat perbandingan detail di bawah | `gemini-embedding-001` (gratis) |
| 5 | **Penyimpanan Vektor** | Supabase pgvector / Pinecone / Chroma | Supabase pgvector (DB yang sama) |
| 6 | **LLM untuk Chat** | Lihat perbandingan detail di bawah | `Gemini 3 Flash Preview` (gratis) |
| 7 | **Streaming Chat** | Vercel AI SDK / Custom SSE / LangChain | Vercel AI SDK (`useChat` hook) |
| 8 | **Orkestrasi RAG** | Custom pipeline / LangChain / LlamaIndex | Custom (~80 baris kode) |

### Keputusan 4: Perbandingan Model Embedding

| Model | Provider | Dimensi | Harga/1M token | Gratis | Catatan Kualitas |
|-------|----------|---------|-----------------|--------|------------------|
| **text-embedding-3-small** | OpenAI | 1536 | $0.02 | Tidak | Standar industri, rasio biaya-performa sangat baik |
| **gemini-embedding-001** | Google | 3072 (bisa diatur: 768/1536/3072) | $0.15 | Ya (free tier di AI Studio) | Matryoshka learning, 100+ bahasa, terbaru |
| **voyage-3.5-lite** | Voyage AI | 2048 (bisa diatur: 256-2048) | $0.02 | 200M token gratis | Mengungguli OpenAI-v3-large 6.34%, kualitas retrieval terbaik |

**Rekomendasi: `gemini-embedding-001`** — Free tier mencukupi seluruh volume MVP. Satu vendor dengan pilihan LLM (Google). Dimensi bisa diatur (gunakan 768 untuk MVP agar hemat penyimpanan, bisa ditingkatkan nanti via Matryoshka).

**Catatan:** Semua opsi bekerja dengan pgvector — cukup atur dimensi VECTOR di skema DB sesuai pilihan (768 untuk Gemini dengan dimensi dikurangi, 1536 untuk OpenAI, 2048 untuk Voyage).

### Keputusan 6: Perbandingan LLM untuk Chat

Semua didukung oleh Vercel AI SDK — pindah provider cukup ubah satu baris kode.

| Model | Provider | Harga (input/output per 1M) | Kecepatan | Konteks | Catatan |
|-------|----------|---------------------------|-----------|---------|---------|
| **Gemini 2.5 Flash** | Google | $0.30 / $2.50 | Cepat | 1M token | Free tier tersedia, stabil dan teruji |
| **Gemini 3 Flash Preview** | Google | $0.50 / $3.00 | Tercepat | 1M token | Free tier, terbaru, 30% lebih hemat token, masih "preview" |
| **GPT-5 mini** | OpenAI | $0.25 / $2.00 | Cepat | 400K token | Bagus untuk tugas yang terdefinisi jelas |
| **GPT-5 nano** | OpenAI | $0.05 / $0.40 | Tercepat | 400K token | OpenAI termurah, bagus untuk FAQ |

**Rekomendasi: `Gemini 3 Flash Preview`** — Free tier mencukupi demo MVP. Vendor sama dengan embedding = satu API key (`GOOGLE_GENERATIVE_AI_API_KEY`). Context window 1M token. Model terbaru dan tercepat dari Google, 30% lebih hemat token. Kualitas terbaik untuk RAG Q&A.

**Insight utama**: Untuk demo MVP, **Google free tier = biaya $0** untuk embedding DAN chat. Satu vendor, satu API key. Bisa ganti provider kapan saja — Vercel AI SDK membuat perpindahan cukup ubah satu baris.

### Dependensi Baru (hanya 3 package)
- `ai` — Vercel AI SDK core
- `@ai-sdk/google` — Google Gemini provider (embedding + chat)
- `pdf-parse` — Ekstraksi teks PDF

### Variabel Lingkungan Baru
- `GOOGLE_GENERATIVE_AI_API_KEY` — satu key untuk embedding dan chat (free tier)

## Bagian 3: Urutan Pembangunan — Fondasi + Irisan Vertikal

### Mengapa Pendekatan Ini

| Pendekatan | Penilaian |
|------------|-----------|
| Bottom-up (DB → backend → frontend) | Terlalu lama sebelum ada yang terlihat |
| UI shell dulu, baru sambungkan | Perlu rework saat bentuk backend berbeda |
| **Fondasi + Irisan vertikal** | Basis stabil, lalu fitur bertahap yang bisa diuji |

### 5 Fase

**Fase 0: Fondasi**
- Install dependensi, variabel lingkungan, migrasi Supabase (pgvector, tabel documents, tabel chunks, storage bucket, fungsi match)
- Navbar bersama, update tata letak app, komponen shadcn (Dialog, Badge, Sonner, ScrollArea)
- Setup klien Gemini

**Fase 1: Knowledge Base & Dev Tools**
- Knowledge Base: Tipe data, Server Actions (CRUD), drop zone, daftar file, dialog hapus, notifikasi toast
- Dev Tools: Halaman `/dev-tools` dengan tombol "Reset Semua Data" (hapus document_chunks, documents, dan Storage bucket), dialog konfirmasi (aksi destruktif), tampilan statistik penggunaan Supabase (jumlah dokumen, jumlah chunk, penyimpanan terpakai)
- Uji KB: upload file, lihat di daftar, hapus berfungsi
- Uji Dev Tools: reset data membersihkan seluruh dokumen, chunks, dan file storage

**Fase 2: Pipeline Pemrosesan Dokumen**
- Ekstraktor teks PDF, chunker, layanan embedding
- Orkestrator pemrosesan: unduh → ekstrak → potong → embed → simpan → update status
- Sambungkan ke alur upload
- Uji: upload dokumen PDF asli, verifikasi chunks + embedding di DB

**Fase 3: Fitur Chat**
- Route API chat dengan RAG (embed query → pencarian vektor → konteks → stream LLM)
- Semua komponen UI: welcome state, gelembung chat, blok sumber, indikator mengetik, input, state error
- Penyusunan system prompt
- Uji: ajukan pertanyaan, verifikasi jawaban akurat dengan atribusi sumber

**Fase 4: Polish**
- Pengujian end-to-end, penanganan error, animasi, pengecekan responsif

### Mengapa Knowledge Base Sebelum Chat
Chat bergantung pada dokumen di vector store. Tidak bisa menguji RAG tanpa data.

## Bagian 4: Skema Database

```sql
-- tabel documents (dokumen yang diunggah)
documents (
  id UUID PK,
  filename TEXT,
  file_size INTEGER,
  file_path TEXT,        -- path di Supabase Storage
  mime_type TEXT,
  status TEXT,           -- 'uploading' | 'processing' | 'ready' | 'error'
  error_message TEXT,
  chunk_count INTEGER,
  created_at, updated_at
)

-- tabel document_chunks (potongan dokumen dengan embedding vektor)
document_chunks (
  id UUID PK,
  document_id UUID FK → documents(id) ON DELETE CASCADE,
  content TEXT,
  chunk_index INTEGER,
  embedding VECTOR(768),  -- dimensi embedding Gemini (bisa diatur via Matryoshka)
  metadata JSONB,
  created_at
)

-- fungsi pencarian kemiripan pgvector
match_documents(query_embedding, threshold, count)
  → mengembalikan chunks + skor kemiripan + nama file
```

## Bagian 5: Alur Pipeline RAG

```
Pengguna bertanya "Janasku terbuat dari apa?"
  1. Embed query → Gemini gemini-embedding-001 → float[768]
  2. Pencarian vektor → match_documents() → 5 chunk paling mirip
  3. Bangun konteks → format chunks dengan atribusi sumber
  4. System prompt + konteks + pertanyaan → Gemini 3 Flash Preview
  5. Stream respons → Vercel AI SDK → klien
  6. Tampilkan jawaban + referensi sumber
```

## Bagian 6: Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| pgvector tidak tersedia di Supabase lokal | Verifikasi di Fase 0 terlebih dahulu (Supabase CLI v1.100+ sudah menyertakannya) |
| Kualitas parsing PDF (gambar hasil scan) | Uji dengan dokumen Janasku asli sejak awal; tambahkan peringatan untuk PDF hanya gambar |
| Batas rate limit Google free tier | Untuk volume MVP/demo seharusnya cukup; pantau penggunaan |
| Penyesuaian ukuran chunk | Mulai 1000 karakter / 200 overlap, sesuaikan berdasarkan pengujian dokumen nyata |
| Timeout pemrosesan dokumen di serverless | Untuk dokumen <10MB seharusnya aman; gunakan pola async jika diperlukan |
| Kualitas embedding Gemini vs alternatif | 768 dimensi cukup untuk KB kecil; bisa beralih ke OpenAI/Voyage nanti (ubah satu baris) |
| Akumulasi data di Supabase free tier (1GB storage, 500MB DB) | Dev Tools halaman `/dev-tools` dengan tombol reset untuk membersihkan data selama pengembangan/demo |

## Bagian 7: Struktur File yang Diusulkan

```
src/
  app/
    layout.tsx                      (update: tambah Navbar)
    page.tsx                        (update: redirect)
    knowledge-base/page.tsx         (baru)
    chat/page.tsx                   (baru)
    dev-tools/page.tsx              (baru)
    api/chat/route.ts               (baru)
  features/
    dev-tools/
      types.ts
      index.ts
      actions/dev-tools-actions.ts
      components/
        reset-data-button.tsx
        confirm-reset-dialog.tsx
        usage-stats.tsx
    knowledge-base/
      types.ts
      index.ts
      actions/document-actions.ts
      components/
        drop-zone.tsx
        file-list.tsx
        file-item.tsx
        delete-dialog.tsx
      lib/
        pdf-extractor.ts
        chunker.ts
        process-document.ts
    chat/
      types.ts
      index.ts
      components/
        chat-container.tsx
        chat-bubble.tsx
        chat-input.tsx
        welcome-state.tsx
        source-block.tsx
        typing-indicator.tsx
        error-message.tsx
      lib/
        embeddings.ts
        vector-search.ts
        rag-context.ts
        system-prompt.ts
  shared/
    components/navbar.tsx           (baru)
    lib/gemini.ts                   (baru)
```

---

# Implementation Brainstorming — Janasku RAG Chatbot MVP

## Context

After completing all Phase 1 discovery (business problem, BRD/PRD, wireframes, design system), we need to plan the actual implementation. The MVP scope is two pages: **Knowledge Base** (`/knowledge-base`) and **Chat** (`/chat`), no auth, Indonesian language.

## Part 1: Problem/Task Breakdown — 7 Workstreams

The MVP breaks down into **7 workstreams** with clear dependencies:

```
W1: Shared Layout & Navigation
W2: Database Schema & Storage Infrastructure
W3: Knowledge Base Feature (File Management)
W4: Document Processing Pipeline
W5: RAG Pipeline (Embeddings + Vector Search)
W6: Chat Feature (UI + LLM Integration)
W7: Dev Tools (Data Reset & Usage Stats)
```

### Dependency Flow

```
W1 (Layout) ──┬──> W3 (Knowledge Base UI)
               ├──> W6 (Chat UI)
               └──> W7 (Dev Tools UI)
W2 (DB/Storage) ──┬──> W3
                   ├──> W5 (RAG Pipeline)
                   └──> W7
W3 ──> W4 (Doc Processing) ──> W5 ──> W6
```

**W1 & W2** are foundation (no deps). **W3** needs W1+W2. **W4** needs W3. **W5** needs W2+W4. **W6** needs everything. **W7** needs W1+W2 (can be built in parallel with W3).

## Part 2: Technology Decisions

### What We Already Have
- Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui
- Supabase (PostgreSQL + Storage + local CLI)
- Feature-based architecture (`src/features/`, `src/shared/`)
- Server Actions pattern (established by todo feature)

### 8 Key Decisions

| # | Decision | Options | Recommendation |
|---|----------|---------|---------------|
| 1 | **File Storage** | Supabase Storage / S3 / Local | Supabase Storage (already in stack) |
| 2 | **Text Extraction** | pdf-parse / LangChain loaders / Unstructured.io | pdf-parse (KISS, PDF only for MVP) |
| 3 | **Text Chunking** | Custom splitter / LangChain splitters | Custom (~50 LOC) |
| 4 | **Embeddings** | See detailed comparison below | `gemini-embedding-001` (free tier) |
| 5 | **Vector Storage** | Supabase pgvector / Pinecone / Chroma | Supabase pgvector (same DB) |
| 6 | **LLM for Chat** | See detailed comparison below | `Gemini 3 Flash Preview` (free tier) |
| 7 | **Chat Streaming** | Vercel AI SDK / Custom SSE / LangChain | Vercel AI SDK (`useChat` hook) |
| 8 | **RAG Orchestration** | Custom pipeline / LangChain / LlamaIndex | Custom (~80 LOC) |

### Decision 4: Embedding Model Comparison

| Model | Provider | Dimensions | Price/1M tokens | Free Tier | Quality Notes |
|-------|----------|-----------|-----------------|-----------|---------------|
| **text-embedding-3-small** | OpenAI | 1536 | $0.02 | None | Industry standard, excellent cost-to-performance ratio |
| **gemini-embedding-001** | Google | 3072 (configurable: 768/1536/3072) | $0.15 | Yes (free tier on AI Studio) | Matryoshka learning, 100+ languages, newest |
| **voyage-3.5-lite** | Voyage AI | 2048 (configurable: 256-2048) | $0.02 | 200M tokens free | Outperforms OpenAI-v3-large by 6.34%, best retrieval quality |

**Recommendation: `gemini-embedding-001`** — Free tier covers all MVP volumes. Single vendor with LLM choice (Google). Configurable dimensions (use 768 for MVP to save storage, upgradeable later via Matryoshka).

**Note:** All options work with pgvector — just set the VECTOR dimension in the DB schema to match (768 for Gemini at reduced dim, 1536 for OpenAI, 2048 for Voyage).

### Decision 6: LLM for Chat Comparison

All supported by Vercel AI SDK — switching providers is a one-line change.

| Model | Provider | Price (input/output per 1M) | Speed | Context | Notes |
|-------|----------|---------------------------|-------|---------|-------|
| **Gemini 2.5 Flash** | Google | $0.30 / $2.50 | Fast | 1M tokens | Free tier available, proven stable |
| **Gemini 3 Flash Preview** | Google | $0.50 / $3.00 | Fastest | 1M tokens | Free tier, newest, 30% fewer tokens used, still "preview" |
| **GPT-5 mini** | OpenAI | $0.25 / $2.00 | Fast | 400K tokens | Great for well-defined tasks |
| **GPT-5 nano** | OpenAI | $0.05 / $0.40 | Fastest | 400K tokens | Cheapest OpenAI, good for FAQ-style |

**Recommendation: `Gemini 3 Flash Preview`** — Free tier covers MVP demo. Same vendor as embeddings = single API key (`GOOGLE_GENERATIVE_AI_API_KEY`). 1M context window. Newest and fastest Google model, 30% fewer tokens used. Best quality for RAG Q&A.

**Key insight**: For MVP demo, **Google free tier = $0 cost** for both embeddings AND chat. Single vendor, single API key. Can always switch providers later — Vercel AI SDK makes it a one-line change.

### New Dependencies (only 3 packages)
- `ai` — Vercel AI SDK core
- `@ai-sdk/google` — Google Gemini provider (embeddings + chat)
- `pdf-parse` — PDF text extraction

### New Environment Variables
- `GOOGLE_GENERATIVE_AI_API_KEY` — single key for both embeddings and chat (free tier)

## Part 3: Build Order — Foundation + Vertical Slices

### Why This Approach

| Approach | Verdict |
|----------|---------|
| Bottom-up (DB → backend → frontend) | Too long before anything visible |
| UI shell first, then wire up | Rework when backend shapes differ |
| **Foundation + Vertical slices** | Stable base, then incremental testable features |

### 5 Phases

**Phase 0: Foundation**
- Install deps, env vars, Supabase migrations (pgvector, documents table, chunks table, storage bucket, match function)
- Shared navbar, app layout update, shadcn components (Dialog, Badge, Sonner, ScrollArea)
- Gemini client setup

**Phase 1: Knowledge Base & Dev Tools**
- Knowledge Base: Types, Server Actions (CRUD), drop zone, file list, delete dialog, toast notifications
- Dev Tools: `/dev-tools` page with "Reset All Data" button (clears document_chunks, documents, and Storage bucket), confirmation dialog (destructive action), Supabase usage stats display (document count, chunk count, storage used)
- Test KB: upload files, see them in list, delete works
- Test Dev Tools: reset data clears all documents, chunks, and storage files

**Phase 2: Document Processing Pipeline**
- PDF text extractor, chunker, embedding service
- Processing orchestrator: download → extract → chunk → embed → store → update status
- Wire into upload flow
- Test: upload real PDF document, verify chunks + embeddings in DB

**Phase 3: Chat Feature**
- Chat API route with RAG (embed query → vector search → context → stream LLM)
- All UI components: welcome state, chat bubbles, source blocks, typing indicator, input, error state
- System prompt crafting
- Test: ask questions, verify accurate answers with source attribution

**Phase 4: Polish**
- End-to-end testing, error handling, animations, responsive check

### Why Knowledge Base Before Chat
Chat depends on having documents in the vector store. Can't test RAG without data.

## Part 4: Database Schema

```sql
-- documents table
documents (
  id UUID PK,
  filename TEXT,
  file_size INTEGER,
  file_path TEXT,        -- Supabase Storage path
  mime_type TEXT,
  status TEXT,           -- 'uploading' | 'processing' | 'ready' | 'error'
  error_message TEXT,
  chunk_count INTEGER,
  created_at, updated_at
)

-- document_chunks table (with vector embeddings)
document_chunks (
  id UUID PK,
  document_id UUID FK → documents(id) ON DELETE CASCADE,
  content TEXT,
  chunk_index INTEGER,
  embedding VECTOR(768),  -- Gemini embedding dimension (configurable via Matryoshka)
  metadata JSONB,
  created_at
)

-- pgvector similarity search function
match_documents(query_embedding, threshold, count)
  → returns chunks + similarity score + filename
```

## Part 5: RAG Pipeline Flow

```
User asks "Janasku terbuat dari apa?"
  1. Embed query → Gemini gemini-embedding-001 → float[768]
  2. Vector search → match_documents() → top 5 similar chunks
  3. Build context → format chunks with source attribution
  4. System prompt + context + question → Gemini 3 Flash Preview
  5. Stream response → Vercel AI SDK → client
  6. Display answer + source references
```

## Part 6: Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| pgvector not available in local Supabase | Verify in Phase 0 first (Supabase CLI v1.100+ ships it) |
| PDF parsing quality (scanned images) | Test with real Janasku docs early; add warning for image-only PDFs |
| Google free tier rate limits | For MVP/demo volumes should be fine; monitor usage |
| Chunk size tuning | Start 1000 chars / 200 overlap, adjust based on real doc testing |
| Document processing timeout in serverless | For <10MB docs should be fine; async pattern if needed |
| Gemini embedding quality vs alternatives | 768 dims is sufficient for small KB; can switch to OpenAI/Voyage later (one-line change) |
| Data accumulation on Supabase free tier (1GB storage, 500MB DB) | Dev Tools page at `/dev-tools` with reset button to clear data during development/demo |

## Part 7: Proposed File Structure

```
src/
  app/
    layout.tsx                      (update: add Navbar)
    page.tsx                        (update: redirect)
    knowledge-base/page.tsx         (new)
    chat/page.tsx                   (new)
    dev-tools/page.tsx              (new)
    api/chat/route.ts               (new)
  features/
    dev-tools/
      types.ts
      index.ts
      actions/dev-tools-actions.ts
      components/
        reset-data-button.tsx
        confirm-reset-dialog.tsx
        usage-stats.tsx
    knowledge-base/
      types.ts
      index.ts
      actions/document-actions.ts
      components/
        drop-zone.tsx
        file-list.tsx
        file-item.tsx
        delete-dialog.tsx
      lib/
        pdf-extractor.ts
        chunker.ts
        process-document.ts
    chat/
      types.ts
      index.ts
      components/
        chat-container.tsx
        chat-bubble.tsx
        chat-input.tsx
        welcome-state.tsx
        source-block.tsx
        typing-indicator.tsx
        error-message.tsx
      lib/
        embeddings.ts
        vector-search.ts
        rag-context.ts
        system-prompt.ts
  shared/
    components/navbar.tsx           (new)
    lib/gemini.ts                   (new)
```
