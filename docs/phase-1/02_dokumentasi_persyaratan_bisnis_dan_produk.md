# Dokumentasi Persyaratan Bisnis & Produk — Janasku RAG Chatbot MVP

## Konteks Bisnis

### Masalah

Owner Janasku saat ini menjawab pertanyaan pelanggan secara manual — berulang-ulang menjawab hal yang sama tentang produk (bahan, cara pakai, harga, ketersediaan). Ini menghabiskan waktu owner yang seharusnya bisa digunakan untuk mengembangkan bisnis.

### Solusi

Chatbot cerdas yang menjawab pertanyaan pelanggan secara otomatis berdasarkan dokumen produk yang diunggah owner. Owner cukup unggah file informasi produk sekali, chatbot yang melayani pelanggan seterusnya.

### Nilai Bisnis

- **Efisiensi waktu owner** — jam yang sebelumnya habis untuk menjawab chat bisa dialokasikan ke aktivitas bisnis lain
- **Konsistensi jawaban** — pelanggan selalu mendapat informasi yang sama dan akurat
- **Ketersediaan 24/7** — pelanggan bisa bertanya kapan saja tanpa menunggu owner online

## Ringkasan Produk

Janasku RAG Chatbot adalah aplikasi web sederhana yang memungkinkan owner mengunggah file-file pengetahuan produk (seperti Google Drive/Dropbox), lalu chatbot cerdas akan menjawab pertanyaan pelanggan secara otomatis berdasarkan isi file-file tersebut. MVP ini fokus pada dua hal saja: **unggah file** dan **chatbot**.

## Tujuan MVP

1. **Validasi konsep** — membuktikan bahwa chatbot bisa menjawab pertanyaan pelanggan Janasku dengan akurat berdasarkan file yang diunggah
2. **Mengurangi beban owner** — pertanyaan rutin pelanggan dijawab otomatis oleh chatbot

## Pengguna

| Pengguna | Peran | Akses |
|----------|-------|-------|
| **Owner** | Mengunggah, melihat, dan menghapus file knowledge base | Halaman Knowledge Base |
| **Pelanggan** | Bertanya tentang produk Janasku via chatbot | Halaman Chat |

> **Catatan MVP:** Tidak ada autentikasi. Semua halaman terbuka untuk siapa saja.

## Fitur MVP

### Fitur 1: Knowledge Base Management (Halaman Upload File)

Halaman sederhana seperti Google Drive — owner bisa mengunggah file yang berisi informasi produk Janasku.

**Kemampuan:**
- Unggah file (drag & drop atau klik untuk pilih file)
- Format yang didukung: **PDF, TXT, DOCX**
- Lihat daftar file yang sudah diunggah (nama file, ukuran, tanggal upload)
- Hapus file yang tidak diperlukan lagi
- Setelah file diunggah, sistem otomatis memproses file sehingga chatbot bisa merujuknya

**User Flow:**
```
Owner buka halaman /knowledge-base
  → Klik "Upload File" atau drag & drop file
  → Sistem mengunggah dan memproses file
  → File muncul di daftar dengan status "Siap"
  → Owner bisa hapus file jika diperlukan
```

### Fitur 2: RAG Chatbot (Halaman Chat)

Halaman chat sederhana dimana pelanggan bisa bertanya tentang produk Janasku dan mendapat jawaban yang akurat berdasarkan knowledge base.

**Kemampuan:**
- Input chat untuk mengetik pertanyaan
- Chatbot menjawab berdasarkan isi file yang sudah diunggah
- Menampilkan sumber referensi (dari file mana jawaban diambil)
- Jika tidak ada informasi yang relevan, chatbot menjawab dengan jujur bahwa informasi tersebut belum tersedia

**User Flow:**
```
Pelanggan buka halaman /chat
  → Ketik pertanyaan (misal: "Janasku terbuat dari apa?")
  → Chatbot menampilkan jawaban beserta sumber referensi
```

## Wireframe

### Halaman Knowledge Base (`/knowledge-base`)

```
┌─────────────────────────────────────────────────┐
│  Janasku Knowledge Base                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │   📁  Drag & drop file ke sini          │    │
│  │       atau klik untuk pilih file        │    │
│  │                                         │    │
│  │       PDF, TXT, DOCX                    │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  File yang diunggah                             │
│  ┌──────────────────────────────────────────┐   │
│  │ Nama File        Ukuran   Tanggal  Aksi  │   │
│  ├──────────────────────────────────────────┤   │
│  │ panduan-produk   1.2 MB   27 Feb   [x]   │   │
│  │   .pdf           ✅ Siap                  │   │
│  ├──────────────────────────────────────────┤   │
│  │ faq-janasku      340 KB   26 Feb   [x]   │   │
│  │   .txt           ✅ Siap                  │   │
│  ├──────────────────────────────────────────┤   │
│  │ bahan-baku       890 KB   25 Feb   [x]   │   │
│  │   .docx          ⏳ Memproses...          │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Halaman Chat (`/chat`)

```
┌─────────────────────────────────────────────────┐
│  Janasku Chatbot                                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │  👤 Janasku terbuat dari apa?            │    │
│  │                                         │    │
│  │  🤖 Janasku terbuat dari bahan-bahan     │    │
│  │     alami pilihan, antara lain:         │    │
│  │     - Madu murni                        │    │
│  │     - Ekstrak herbal                    │    │
│  │     - Rempah-rempah tradisional         │    │
│  │                                         │    │
│  │     📎 Sumber: panduan-produk.pdf       │    │
│  │                                         │    │
│  │  👤 Bagaimana cara pakainya?             │    │
│  │                                         │    │
│  │  🤖 Cara penggunaan Janasku:            │    │
│  │     1. Minum 1 sendok makan ...         │    │
│  │     2. Bisa dicampur dengan air ...     │    │
│  │                                         │    │
│  │     📎 Sumber: panduan-produk.pdf       │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌───────────────────────────────┐ ┌──────┐    │
│  │ Ketik pertanyaan...           │ │Kirim │    │
│  └───────────────────────────────┘ └──────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Yang TIDAK Termasuk MVP

| Fitur | Alasan Dikeluarkan |
|-------|-------------------|
| Landing page | MVP fokus fungsionalitas inti, bukan marketing |
| Autentikasi | Mempercepat development, bisa ditambah nanti |
| Analytics/dashboard | Belum prioritas untuk validasi konsep |
| Multi-bahasa chatbot | Cukup Bahasa Indonesia dulu |
| Payment integration | Di luar scope chatbot |
| Chat history persistence | MVP cukup per-session saja |
| Multiple knowledge base/tenant | Satu owner, satu knowledge base |

## Kriteria Sukses MVP

1. **Owner bisa upload file** — PDF, TXT, atau DOCX berhasil diunggah dan diproses
2. **Owner bisa lihat dan hapus file** — Daftar file tampil dengan benar, bisa dihapus
3. **Chatbot menjawab dengan akurat** — Jawaban berdasarkan isi file, bukan halusinasi
4. **Chatbot menunjukkan sumber** — Pelanggan tahu dari file mana jawaban diambil
5. **Chatbot jujur** — Jika tidak tahu, bilang tidak tahu (bukan mengarang jawaban)
6. **Respons cepat** — Jawaban muncul dalam waktu yang wajar (< 10 detik)

---

# Business & Product Requirements Document — Janasku RAG Chatbot MVP

## Business Context

### Problem

The Janasku owner currently answers customer questions manually — repeatedly answering the same things about products (ingredients, usage, pricing, availability). This consumes time that could be spent growing the business.

### Solution

An intelligent chatbot that automatically answers customer questions based on product documents uploaded by the owner. The owner uploads product information files once, and the chatbot handles customer inquiries from there.

### Business Value

- **Owner time efficiency** — hours previously spent answering chats can be allocated to other business activities
- **Answer consistency** — customers always receive the same accurate information
- **24/7 availability** — customers can ask anytime without waiting for the owner to be online

## Product Summary

Janasku RAG Chatbot is a simple web application that allows the owner to upload product knowledge files (like Google Drive/Dropbox), then an intelligent chatbot automatically answers customer questions based on the contents of those files. This MVP focuses on two things only: **file upload** and **chatbot**.

## MVP Goals

1. **Validate the concept** — prove that a chatbot can accurately answer Janasku customer questions based on uploaded files
2. **Reduce owner's burden** — routine customer questions are answered automatically by the chatbot

## Users

| User | Role | Access |
|------|------|--------|
| **Owner** | Upload, view, and delete knowledge base files | Knowledge Base page |
| **Customer** | Ask questions about Janasku products via chatbot | Chat page |

> **MVP Note:** No authentication. All pages are publicly accessible.

## MVP Features

### Feature 1: Knowledge Base Management (File Upload Page)

A simple page like Google Drive — the owner can upload files containing Janasku product information.

**Capabilities:**
- Upload files (drag & drop or click to select)
- Supported formats: **PDF, TXT, DOCX**
- View list of uploaded files (filename, size, upload date)
- Delete files that are no longer needed
- After upload, the system automatically processes the file so the chatbot can reference it

**User Flow:**
```
Owner opens /knowledge-base
  → Click "Upload File" or drag & drop a file
  → System uploads and processes the file
  → File appears in the list with "Ready" status
  → Owner can delete file if needed
```

### Feature 2: RAG Chatbot (Chat Page)

A simple chat page where customers can ask about Janasku products and get accurate answers based on the knowledge base.

**Capabilities:**
- Chat input for typing questions
- Chatbot answers based on uploaded file contents
- Shows source references (which file the answer came from)
- If no relevant information exists in the knowledge base, the chatbot honestly states that the information is not yet available

**User Flow:**
```
Customer opens /chat
  → Types a question (e.g., "What is Janasku made of?")
  → Chatbot displays answer along with source references
```

## Wireframes

### Knowledge Base Page (`/knowledge-base`)

```
┌─────────────────────────────────────────────────┐
│  Janasku Knowledge Base                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │   📁  Drag & drop files here            │    │
│  │       or click to select files          │    │
│  │                                         │    │
│  │       PDF, TXT, DOCX                    │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Uploaded Files                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ Filename          Size     Date   Action  │   │
│  ├──────────────────────────────────────────┤   │
│  │ product-guide     1.2 MB   27 Feb  [x]   │   │
│  │   .pdf            ✅ Ready                │   │
│  ├──────────────────────────────────────────┤   │
│  │ faq-janasku       340 KB   26 Feb  [x]   │   │
│  │   .txt            ✅ Ready                │   │
│  ├──────────────────────────────────────────┤   │
│  │ ingredients       890 KB   25 Feb  [x]   │   │
│  │   .docx           ⏳ Processing...        │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Chat Page (`/chat`)

```
┌─────────────────────────────────────────────────┐
│  Janasku Chatbot                                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │  👤 What is Janasku made of?             │    │
│  │                                         │    │
│  │  🤖 Janasku is made from selected        │    │
│  │     natural ingredients, including:     │    │
│  │     - Pure honey                        │    │
│  │     - Herbal extracts                   │    │
│  │     - Traditional spices                │    │
│  │                                         │    │
│  │     📎 Source: product-guide.pdf         │    │
│  │                                         │    │
│  │  👤 How do I use it?                     │    │
│  │                                         │    │
│  │  🤖 How to use Janasku:                  │    │
│  │     1. Take 1 tablespoon ...            │    │
│  │     2. Can be mixed with water ...      │    │
│  │                                         │    │
│  │     📎 Source: product-guide.pdf         │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌───────────────────────────────┐ ┌──────┐    │
│  │ Type your question...         │ │ Send │    │
│  └───────────────────────────────┘ └──────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Out of Scope for MVP

| Feature | Reason Excluded |
|---------|----------------|
| Landing page | MVP focuses on core functionality, not marketing |
| Authentication | Speeds up development, can be added later |
| Analytics/dashboard | Not a priority for concept validation |
| Multi-language chatbot | Indonesian only for now |
| Payment integration | Outside chatbot scope |
| Chat history persistence | MVP is per-session only |
| Multiple knowledge base/tenant | One owner, one knowledge base |

## MVP Success Criteria

1. **Owner can upload files** — PDF, TXT, or DOCX uploads and processes successfully
2. **Owner can view and delete files** — File list displays correctly, files can be deleted
3. **Chatbot answers accurately** — Answers are based on file contents, not hallucinations
4. **Chatbot shows sources** — Customers know which file the answer came from
5. **Chatbot is honest** — If it doesn't know, it says so (no fabricated answers)
6. **Fast response** — Answers appear within a reasonable time (< 10 seconds)
