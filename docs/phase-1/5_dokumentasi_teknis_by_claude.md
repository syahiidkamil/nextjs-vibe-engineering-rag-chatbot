# Dokumentasi Teknis Sistem (v2)
## Solusi: Janasku RAG Chatbot

Dokumen ini menjelaskan arsitektur teknis dan panduan integrasi terbaru untuk membangun aplikasi purwarupa (MVP) RAG Chatbot Janasku.

### 1. Teknologi (Tech Stack)

| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS dengan pendekatan Glassmorphism organik |
| Vector Database | Supabase (PostgreSQL + ekstensi `pgvector`) |
| Model Chat (LLM) | Google Gemini `gemini-3-flash-preview` |
| Model Embedding | Google Gemini `gemini-embedding-001` |
| Client API AI | HTTP REST API native (`fetch`) — **tanpa** AI SDK |

### 2. Variabel Lingkungan (Environment Variables)

Buat file `.env.local` di *root* proyek:

```env
# Koneksi Database Supabase
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJh..."

# Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
```

### 3. Konstanta API

```typescript
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const CHAT_MODEL = "gemini-3-flash-preview";
const EMBEDDING_MODEL = "gemini-embedding-001";
```

Autentikasi menggunakan header `x-goog-api-key` (bukan *query parameter*).

### 4. Integrasi Embedding (`gemini-embedding-001`)

Model `gemini-embedding-001` mengonversi teks menjadi vektor numerik untuk pencarian semantik.

**Spesifikasi:**
- Batas token input: 2.048
- Dimensi output default: 3.072 (bisa dikecilkan ke 768 atau 1.536)
- Teknik: Matryoshka Representation Learning (MRL)

**A. Embedding Dokumen (saat unggah Knowledge Base)**

Gunakan `taskType: "RETRIEVAL_DOCUMENT"` untuk mengindeks dokumen:

```typescript
const response = await fetch(
  `${BASE_URL}/${EMBEDDING_MODEL}:embedContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: "Teks konten dari SOP Janasku..." }],
      },
      taskType: "RETRIEVAL_DOCUMENT",
      // output_dimensionality: 768, // opsional: kecilkan dimensi
    }),
  }
);

const data = await response.json();
const embedding = data.embedding.values; // number[]
```

**B. Embedding Pertanyaan (saat user chat)**

Gunakan `taskType: "RETRIEVAL_QUERY"` untuk pertanyaan pengguna:

```typescript
const response = await fetch(
  `${BASE_URL}/${EMBEDDING_MODEL}:embedContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: "Berapa harga botol 250ml?" }],
      },
      taskType: "RETRIEVAL_QUERY",
    }),
  }
);
```

**Task Type yang Relevan untuk RAG:**

| Task Type | Kapan Dipakai |
|-----------|---------------|
| `RETRIEVAL_DOCUMENT` | Saat menyimpan dokumen ke database |
| `RETRIEVAL_QUERY` | Saat mengonversi pertanyaan user untuk pencarian |
| `QUESTION_ANSWERING` | Alternatif untuk pertanyaan di sistem QA |

### 5. Integrasi Chat (`gemini-3-flash-preview`)

**A. Standar (generateContent)**

Menerima seluruh respons sekaligus:

```typescript
const response = await fetch(
  `${BASE_URL}/${CHAT_MODEL}:generateContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Konteks SOP:\n${relevantContext}\n\nPertanyaan: ${userQuestion}`,
            },
          ],
        },
      ],
    }),
  }
);

const data = await response.json();
const reply = data.candidates[0].content.parts[0].text;
```

**B. Streaming (streamGenerateContent)**

Mengirim respons secara bertahap via Server-Sent Events (SSE):

```typescript
const response = await fetch(
  `${BASE_URL}/${CHAT_MODEL}:streamGenerateContent?alt=sse`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Konteks SOP:\n${relevantContext}\n\nPertanyaan: ${userQuestion}`,
            },
          ],
        },
      ],
    }),
  }
);

// Baca stream SSE
const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Parse setiap baris "data: {...}" dari SSE
  const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
  for (const line of lines) {
    const json = JSON.parse(line.slice(6));
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    // Kirim `text` ke client secara incremental
  }
}
```

**Struktur Respons:**

```json
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "Harga botol 250ml adalah Rp15.000..." }],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ]
}
```

### 6. Arsitektur RAG

#### A. Alur Unggah Dokumen (Knowledge Base Ingestion)

```
Admin unggah dokumen (PDF/TXT)
        │
        ▼
Next.js API parsing → chunks teks
        │
        ▼
Gemini embedContent (taskType: RETRIEVAL_DOCUMENT)
        │
        ▼
Simpan vektor + teks asli ke Supabase (pgvector)
```

1. Admin mengunggah dokumen melalui antarmuka web.
2. Next.js API mem-*parsing* dokumen menjadi *chunks* teks.
3. Setiap *chunk* dikirim ke `gemini-embedding-001` untuk dikonversi menjadi vektor.
4. Vektor beserta teks asli disimpan di Supabase menggunakan `pgvector`.

#### B. Alur Chat (Retrieval-Augmented Generation)

```
User mengetik pertanyaan
        │
        ▼
Gemini embedContent (taskType: RETRIEVAL_QUERY)
        │
        ▼
Cosine Similarity search di Supabase (pgvector)
        │
        ▼
Konteks relevan + pertanyaan → System Prompt
        │
        ▼
Gemini generateContent / streamGenerateContent
        │
        ▼
Respons ke user
```

1. User mengetik pertanyaan.
2. Pertanyaan dikonversi menjadi vektor menggunakan `gemini-embedding-001`.
3. Vektor dicocokkan dengan dokumen di Supabase via *Cosine Similarity*.
4. Konteks relevan disuntikkan ke *prompt* bersama pertanyaan user.
5. *Prompt* akhir dikirim ke `gemini-3-flash-preview` yang diinstruksikan menjawab **hanya** berdasarkan konteks.
6. Respons dikembalikan ke client.

### 7. Integrasi Supabase (pgvector)

**A. Aktifkan ekstensi pgvector:**

```sql
create extension if not exists vector;
```

**B. Tabel penyimpanan dokumen:**

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(3072), -- sesuaikan dimensi
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

**C. Fungsi pencarian vektor (Cosine Similarity):**

```sql
create or replace function match_documents(
  query_embedding vector(3072),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

**D. Pemanggilan dari Next.js:**

```typescript
const { data, error } = await supabase.rpc("match_documents", {
  query_embedding: queryVector,
  match_threshold: 0.7,
  match_count: 5,
});
```

---

# System Technical Documentation (v2)
## Solution: Janasku RAG Chatbot

This document describes the latest technical architecture and integration guidelines for building the Janasku RAG Chatbot prototype (MVP).

### 1. Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS with organic Glassmorphism approach |
| Vector Database | Supabase (PostgreSQL + `pgvector` extension) |
| Chat Model (LLM) | Google Gemini `gemini-3-flash-preview` |
| Embedding Model | Google Gemini `gemini-embedding-001` |
| AI API Client | Native HTTP REST API (`fetch`) — **no** AI SDK |

### 2. Environment Variables

Create a `.env.local` file at the project root:

```env
# Supabase Database Connection
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJh..."

# Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
```

### 3. API Constants

```typescript
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const CHAT_MODEL = "gemini-3-flash-preview";
const EMBEDDING_MODEL = "gemini-embedding-001";
```

Authentication uses the `x-goog-api-key` header (not query parameters).

### 4. Embedding Integration (`gemini-embedding-001`)

The `gemini-embedding-001` model converts text into numerical vectors for semantic search.

**Specifications:**
- Input token limit: 2,048
- Default output dimensions: 3,072 (can be reduced to 768 or 1,536)
- Technique: Matryoshka Representation Learning (MRL)

**A. Document Embedding (when uploading Knowledge Base)**

Use `taskType: "RETRIEVAL_DOCUMENT"` for indexing documents:

```typescript
const response = await fetch(
  `${BASE_URL}/${EMBEDDING_MODEL}:embedContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: "SOP content text from Janasku..." }],
      },
      taskType: "RETRIEVAL_DOCUMENT",
      // output_dimensionality: 768, // optional: reduce dimensions
    }),
  }
);

const data = await response.json();
const embedding = data.embedding.values; // number[]
```

**B. Query Embedding (when user chats)**

Use `taskType: "RETRIEVAL_QUERY"` for user questions:

```typescript
const response = await fetch(
  `${BASE_URL}/${EMBEDDING_MODEL}:embedContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: "How much is a 250ml bottle?" }],
      },
      taskType: "RETRIEVAL_QUERY",
    }),
  }
);
```

**Relevant Task Types for RAG:**

| Task Type | When to Use |
|-----------|-------------|
| `RETRIEVAL_DOCUMENT` | When storing documents to the database |
| `RETRIEVAL_QUERY` | When converting user questions for search |
| `QUESTION_ANSWERING` | Alternative for questions in a QA system |

### 5. Chat Integration (`gemini-3-flash-preview`)

**A. Standard (generateContent)**

Receives the entire response at once:

```typescript
const response = await fetch(
  `${BASE_URL}/${CHAT_MODEL}:generateContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `SOP Context:\n${relevantContext}\n\nQuestion: ${userQuestion}`,
            },
          ],
        },
      ],
    }),
  }
);

const data = await response.json();
const reply = data.candidates[0].content.parts[0].text;
```

**B. Streaming (streamGenerateContent)**

Sends response incrementally via Server-Sent Events (SSE):

```typescript
const response = await fetch(
  `${BASE_URL}/${CHAT_MODEL}:streamGenerateContent?alt=sse`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `SOP Context:\n${relevantContext}\n\nQuestion: ${userQuestion}`,
            },
          ],
        },
      ],
    }),
  }
);

// Read SSE stream
const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Parse each "data: {...}" line from SSE
  const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
  for (const line of lines) {
    const json = JSON.parse(line.slice(6));
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    // Send `text` to client incrementally
  }
}
```

**Response Structure:**

```json
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "The 250ml bottle costs Rp15,000..." }],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ]
}
```

### 6. RAG Architecture

#### A. Document Upload Flow (Knowledge Base Ingestion)

```
Admin uploads document (PDF/TXT)
        │
        ▼
Next.js API parses → text chunks
        │
        ▼
Gemini embedContent (taskType: RETRIEVAL_DOCUMENT)
        │
        ▼
Store vector + original text to Supabase (pgvector)
```

1. Admin uploads documents via the web interface.
2. Next.js API parses the document into text chunks.
3. Each chunk is sent to `gemini-embedding-001` for vector conversion.
4. Vectors along with original text are stored in Supabase using `pgvector`.

#### B. Chat Flow (Retrieval-Augmented Generation)

```
User types a question
        │
        ▼
Gemini embedContent (taskType: RETRIEVAL_QUERY)
        │
        ▼
Cosine Similarity search in Supabase (pgvector)
        │
        ▼
Relevant context + question → System Prompt
        │
        ▼
Gemini generateContent / streamGenerateContent
        │
        ▼
Response to user
```

1. User types a question.
2. The question is converted to a vector using `gemini-embedding-001`.
3. The vector is matched against documents in Supabase via Cosine Similarity.
4. Relevant context is injected into the prompt alongside the user's question.
5. The final prompt is sent to `gemini-3-flash-preview`, instructed to answer **exclusively** based on the provided context.
6. The response is returned to the client.

### 7. Supabase Integration (pgvector)

**A. Enable pgvector extension:**

```sql
create extension if not exists vector;
```

**B. Document storage table:**

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(3072), -- adjust dimensions as needed
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

**C. Vector search function (Cosine Similarity):**

```sql
create or replace function match_documents(
  query_embedding vector(3072),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

**D. Calling from Next.js:**

```typescript
const { data, error } = await supabase.rpc("match_documents", {
  query_embedding: queryVector,
  match_threshold: 0.7,
  match_count: 5,
});
```
