# Dokumentasi Teknis Sistem
## Solusi: Janasku RAG Chatbot

Dokumen ini menjelaskan struktur arsitektur teknis dan panduan integrasi untuk membangun aplikasi purwarupa (MVP) RAG Chatbot Janasku.

### 1. Teknologi (Tech Stack)

Aplikasi akan dibangun menggunakan teknologi berikut:
- **Framework Frontend/Backend**: Next.js (App Router).
- **Styling**: Tailwind CSS / Vanilla CSS dengan pendekatan antarmuka Glassmorphism organik.
- **Vector Database**: Supabase (PostgreSQL dengan ekstensi `pgvector` untuk menyimpan dan mencari konteks dokumen).
- **Large Language Model (LLM)**: Google Gemini API (model perpesanan seperti `gemini-1.5-flash`).
- **Embedding Model**: Google Gemini Embedding (`gemini-embedding-001`).
- **Client API AI**: Menggunakan klien HTTP REST API asli (native `fetch`), **bukan** _library_ Vercel AI SDK, untuk mengakomodasi kebutuhan kustomisasi penuh dan efisiensi.

### 2. Arsitektur Komponen

#### A. Alur Unggah Dokumen (Knowledge Base Ingestion)
1. Admin (Pemilik Janasku) mengunggah dokumen (batas MVP: teks/PDF) melalui antarmuka web.
2. Next.js API me-_parsing_ dokumen tersebut menjadi sekumpulan teks murni (_chunks_).
3. Teks tersebut dikirim ke API Gemini (`gemini-embedding-001`) via HTTP REST `POST` untuk dikonversi menjadi representasi vektor numerik (*embeddings*).
4. Vektor tersebut, beserta teks aslinya, lalu disimpan ke dalam tabel Supabase (menggunakan `pgvector`).

#### B. Alur Chat (Retrieval-Augmented Generation)
1. Pengguna mengetik pertanyaan (misal: "Berapa harga botol 250ml?").
2. Pertanyaan tersebut dikirim ke API internal Next.js.
3. API Next.js mengonversi pertanyaan pengguna menjadi vektor (*embedding*) menggunakan `gemini-embedding-001`.
4. API melakukan pencarian *Cosine Similarity* ke Supabase untuk mencocokkan vektor pertanyaan dengan vektor dokumen (mencari konteks/SOP yang paling relevan).
5. Konteks yang ditemukan lalu disuntikkan ke dalam *System Prompt* bersamaan dengan pertanyaan pengguna.
6. Seluruh _prompt_ akhir ini dikirim ke API Gemini (via HTTP REST API) yang diinstruksikan untuk **hanya** menjawab berdasarkan konteks yang diberikan di *prompt*.
7. Respons Gemini dikirim kembali ke klien untuk ditampilkan.

### 3. Variabel Lingkungan (Environment Variables)

Untuk menjalankan proyek, pastikan membuat file `.env.local` di *root* proyek dengan variabel berikut:

```env
# Koneksi Database Supabase
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJh..."

# Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
```

### 4. Detail Integrasi HTTP REST API Gemini

Sesuai arsitektur, aplikasi ini berkomunikasi langsung dengan Google Gemini via HTTP REST:

**A. Membuat Embeddings (gemini-embedding-001)**
```javascript
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`;

const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: "Teks konten dari SOP..." }] },
        taskType: "RETRIEVAL_DOCUMENT" // Atau RETRIEVAL_QUERY untuk input chat
    })
});
```

**B. Text Generation untuk Chatbot**
```javascript
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`;

const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        contents: [
            {
                role: "user",
                parts: [
                    { text: "Konteks SOP: Harga botol 15rb. \n\nPertanyaan: Berapa harga botolnya?"}
                ]
            }
        ]
    })
});
```

---

# System Technical Documentation
## Solution: Janasku RAG Chatbot

This document explains the technical architecture structure and integration guidelines for building the Janasku RAG Chatbot prototype (MVP) application.

### 1. Tech Stack

The application will be built using the following technologies:
- **Frontend/Backend Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS / Vanilla CSS featuring an organic Glassmorphism approach.
- **Vector Database**: Supabase (PostgreSQL with `pgvector` extension to store and query document context).
- **Large Language Model (LLM)**: Google Gemini API (chat/text models such as `gemini-1.5-flash`).
- **Embedding Model**: Google Gemini Embedding (`gemini-embedding-001`).
- **AI API Client**: Utilizes pure HTTP REST API clients (native `fetch`) **instead** of the Vercel AI SDK, accommodating full customization and footprint efficiency.

### 2. Component Architecture

#### A. Document Upload Flow (Knowledge Base Ingestion)
1. The Admin (Janasku Owner) uploads documents (MVP limits: text/PDF) via the web interface.
2. The Next.js API parses the document into multiple pure text chunks.
3. These text chunks are sent to the Gemini API (`gemini-embedding-001`) via an HTTP REST `POST` request to be converted into numerical vector representations (embeddings).
4. These vectors, along with the original text segments, are subsequently stored in a Supabase table (using `pgvector`).

#### B. Chat Flow (Retrieval-Augmented Generation)
1. The customer types a query (e.g., "How much is a 250ml bottle?").
2. The query is sent to the internal Next.js API.
3. The Next.js API converts the user's query into a vector (embedding) using `gemini-embedding-001`.
4. The API performs a *Cosine Similarity* search on Supabase to match the query vector against document vectors (retrieving the most relevant context/SOP).
5. The retrieved context is then injected into the *System Prompt* alongside the user's question.
6. This final, assembled prompt is dispatched to the Gemini API (via HTTP REST API), instructed to answer **exclusively** based on the provided context in the prompt.
7. Gemini's response is streamed or returned back to the client to be displayed.

### 3. Environment Variables

To run the project, ensure you create a `.env.local` file at the root of the project with the following variables:

```env
# Supabase Database Connection
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJh..."

# Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
```

### 4. Gemini HTTP REST API Integration Details

Per the architectural decision, this application communicates directly with Google Gemini via HTTP REST:

**A. Generating Embeddings (gemini-embedding-001)**
```javascript
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`;

const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: "Text content from SOP..." }] },
        taskType: "RETRIEVAL_DOCUMENT" // Or RETRIEVAL_QUERY for user input
    })
});
```

**B. Text Generation for Chatbot**
```javascript
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`;

const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        contents: [
            {
                role: "user",
                parts: [
                    { text: "Context SOP: Bottle price is 15k. \n\nQuestion: How much is the bottle?"}
                ]
            }
        ]
    })
});
```
