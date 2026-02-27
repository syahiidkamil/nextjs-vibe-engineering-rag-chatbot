# Desain Wireframe Lengkap (Low-Fidelity) — Janasku RAG Chatbot MVP

Dokumen ini menampilkan wireframe lengkap untuk semua halaman dan semua state (kondisi) yang mungkin terjadi di aplikasi MVP. Wireframe menggunakan ASCII art sebagai representasi low-fidelity.

## Navigasi Global

Navigasi sederhana di bagian atas, digunakan di semua halaman.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
└─────────────────────────────────────────────────────┘
```

- Logo/nama brand di kiri
- Dua link navigasi di kanan
- Halaman aktif ditandai dengan garis bawah atau warna berbeda

---

## Halaman Knowledge Base (`/knowledge-base`)

### State 1: Kosong (Belum Ada File)

Tampilan pertama kali saat belum ada file yang diunggah.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base                                     │
│                                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│  ╎                                             ╎   │
│  ╎   📁  Drag & drop file ke sini              ╎   │
│  ╎       atau klik untuk pilih file            ╎   │
│  ╎                                             ╎   │
│  ╎       Mendukung: PDF, TXT, DOCX            ╎   │
│  ╎       Maks: 10 MB per file                  ╎   │
│  ╎                                             ╎   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                                                     │
│  Belum ada file yang diunggah.                      │
│  Unggah file pertama agar chatbot bisa menjawab     │
│  pertanyaan pelanggan.                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### State 2: Upload Sedang Berlangsung

Saat file sedang diunggah dan diproses.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base                                     │
│                                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│  ╎   📁  Drag & drop file ke sini              ╎   │
│  ╎       atau klik untuk pilih file            ╎   │
│  ╎       Mendukung: PDF, TXT, DOCX            ╎   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                                                     │
│  File Diunggah                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ panduan-produk.pdf         1.2 MB    27 Feb  │   │
│  │ ✅ Siap                               [Hapus]│   │
│  ├──────────────────────────────────────────────┤   │
│  │ faq-janasku.txt            340 KB    27 Feb  │   │
│  │ ⏳ Memproses...                              │   │
│  │ ░░░░░░░░░░░░░░████████░░░░░░░░░░░░  60%     │   │
│  ├──────────────────────────────────────────────┤   │
│  │ bahan-baku.docx            890 KB    27 Feb  │   │
│  │ ⬆️ Mengunggah...                              │   │
│  │ ░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░  20%     │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- File yang sudah siap menampilkan tombol `[Hapus]`
- File yang sedang diproses/diunggah menampilkan progress bar
- Tombol hapus tidak muncul saat file masih diproses

### State 3: Terisi (File dengan Berbagai Status)

Keadaan normal setelah beberapa file berhasil diunggah.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base                                     │
│                                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│  ╎   📁  Drag & drop file ke sini              ╎   │
│  ╎       atau klik untuk pilih file            ╎   │
│  ╎       Mendukung: PDF, TXT, DOCX            ╎   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                                                     │
│  File Diunggah (3 file)                             │
│  ┌──────────────────────────────────────────────┐   │
│  │ panduan-produk.pdf         1.2 MB    27 Feb  │   │
│  │ ✅ Siap                               [Hapus]│   │
│  ├──────────────────────────────────────────────┤   │
│  │ faq-janasku.txt            340 KB    26 Feb  │   │
│  │ ✅ Siap                               [Hapus]│   │
│  ├──────────────────────────────────────────────┤   │
│  │ bahan-baku.docx            890 KB    25 Feb  │   │
│  │ ✅ Siap                               [Hapus]│   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### State 4: Error Upload

Saat file gagal diunggah atau gagal diproses.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base                                     │
│                                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│  ╎   📁  Drag & drop file ke sini              ╎   │
│  ╎       atau klik untuk pilih file            ╎   │
│  ╎       Mendukung: PDF, TXT, DOCX            ╎   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ ❌ Gagal mengunggah "laporan.xlsx"           │   │
│  │    Format file tidak didukung.               │   │
│  │    Gunakan PDF, TXT, atau DOCX.              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  File Diunggah (2 file)                             │
│  ┌──────────────────────────────────────────────┐   │
│  │ panduan-produk.pdf         1.2 MB    27 Feb  │   │
│  │ ✅ Siap                               [Hapus]│   │
│  ├──────────────────────────────────────────────┤   │
│  │ bahan-baku.docx            890 KB    25 Feb  │   │
│  │ ❌ Gagal diproses                     [Hapus]│   │
│  │    [Coba Lagi]                               │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Error upload (format salah) muncul sebagai banner di atas daftar file, hilang otomatis setelah beberapa detik
- Error processing muncul di baris file dengan opsi `[Coba Lagi]`

### Interaksi: Dialog Konfirmasi Hapus

Muncul saat owner klik tombol `[Hapus]`.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░  ┌────────────────────────────────────┐  ░░░  │
│  ░░░  │  Hapus File?                       │  ░░░  │
│  ░░░  │                                    │  ░░░  │
│  ░░░  │  "panduan-produk.pdf" akan dihapus │  ░░░  │
│  ░░░  │  dari knowledge base. Chatbot      │  ░░░  │
│  ░░░  │  tidak bisa lagi merujuk file ini. │  ░░░  │
│  ░░░  │                                    │  ░░░  │
│  ░░░  │          [Batal]  [Hapus]          │  ░░░  │
│  ░░░  └────────────────────────────────────┘  ░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Background overlay (░) menutupi konten di belakang
- Tombol `[Hapus]` berwarna merah/destructive
- Tombol `[Batal]` menutup dialog tanpa aksi

### Interaksi: Drag & Drop Aktif

Saat file di-drag ke atas area upload.

```
  ┌═════════════════════════════════════════════┐
  ║                                             ║
  ║   📁  Lepaskan file di sini!                ║
  ║                                             ║
  └═════════════════════════════════════════════┘
```

- Border berubah menjadi garis tebal/warna highlight
- Teks berubah menjadi "Lepaskan file di sini!"

---

## Halaman Chat (`/chat`)

### State 1: Kosong (Belum Ada Percakapan)

Tampilan awal saat pelanggan pertama kali membuka halaman chat.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                                                     │
│                   🤖                                │
│                                                     │
│           Halo! Saya chatbot Janasku.               │
│           Tanyakan apa saja tentang                  │
│           produk kami.                               │
│                                                     │
│           Contoh pertanyaan:                         │
│           • "Janasku terbuat dari apa?"             │
│           • "Bagaimana cara minum Janasku?"         │
│           • "Apakah aman untuk ibu hamil?"          │
│                                                     │
│                                                     │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │ Ketik pertanyaan...               │ │Kirim │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Pesan selamat datang di tengah area chat
- Contoh pertanyaan yang bisa diklik untuk langsung bertanya
- Tombol `[Kirim]` disabled saat input kosong

### State 2: Percakapan Aktif (dengan Sumber Referensi)

Setelah pelanggan mulai bertanya.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│                   Janasku terbuat dari apa?  👤     │
│                                                     │
│  🤖  Janasku terbuat dari 3 bahan utama:            │
│      1. Jahe (Ginger) — menghangatkan badan         │
│      2. Nanas (Pineapple) — sumber vitamin C        │
│      3. Kunyit (Turmeric) — anti-inflamasi          │
│                                                     │
│      Ketiga bahan ini diproses secara modern         │
│      dengan tetap menjaga khasiat tradisional.      │
│                                                     │
│      ┌────────────────────────────────────┐         │
│      │ 📎 Sumber:                         │         │
│      │ • panduan-produk.pdf (hal. 2-3)    │         │
│      └────────────────────────────────────┘         │
│                                                     │
│                Bagaimana cara minumnya?  👤         │
│                                                     │
│  🤖  Cara minum Janasku:                            │
│      • Dewasa: 1 sendok makan, 2x sehari           │
│      • Bisa diminum langsung atau dicampur          │
│        air hangat                                    │
│      • Sebaiknya diminum setelah makan               │
│                                                     │
│      ┌────────────────────────────────────┐         │
│      │ 📎 Sumber:                         │         │
│      │ • panduan-produk.pdf (hal. 5)      │         │
│      │ • faq-janasku.txt                  │         │
│      └────────────────────────────────────┘         │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │ Ketik pertanyaan...               │ │Kirim │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Pesan pelanggan rata kanan, pesan bot rata kiri
- Setiap jawaban bot menampilkan sumber referensi di blok terpisah
- Area chat bisa di-scroll ke atas untuk melihat percakapan sebelumnya

### State 3: Bot Sedang Mengetik

Saat chatbot sedang memproses jawaban.

```
│                                                     │
│               Apakah aman untuk anak?  👤           │
│                                                     │
│  🤖  ●●● Sedang mengetik...                        │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │                                   │ │ ···  │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
```

- Animasi titik-titik (●●●) menunjukkan bot sedang memproses
- Input field di-disable saat bot masih memproses
- Tombol kirim berubah menjadi loading indicator (···)

### State 4: Bot Tidak Tahu Jawabannya

Saat pertanyaan di luar knowledge base.

```
│                                                     │
│                  Berapa harganya?  👤               │
│                                                     │
│  🤖  Maaf, saya belum memiliki informasi            │
│      tentang harga Janasku. Informasi ini           │
│      belum tersedia di knowledge base kami.          │
│                                                     │
│      Silakan hubungi owner langsung untuk            │
│      informasi harga.                                │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │ Ketik pertanyaan...               │ │Kirim │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
```

- Tidak ada blok sumber referensi (karena tidak ada file yang relevan)
- Jawaban tetap sopan dan mengarahkan ke owner untuk pertanyaan di luar scope

### State 5: Error (Gagal Mendapat Jawaban)

Saat terjadi masalah koneksi atau server.

```
│                                                     │
│                  Janasku itu apa?  👤               │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ ❌ Gagal mendapat jawaban. Silakan coba lagi.│   │
│  │                             [Coba Lagi]      │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │ Ketik pertanyaan...               │ │Kirim │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
```

- Pesan error muncul sebagai blok inline di area chat
- Tombol `[Coba Lagi]` mengirim ulang pertanyaan terakhir

---

## Catatan Komponen

| Komponen | Perilaku |
|----------|----------|
| **Nav bar** | Selalu tampil di atas. Link aktif di-highlight. |
| **Drop zone** | Border berubah saat file di-drag ke atasnya. Klik membuka file picker. |
| **Daftar file** | Diurutkan berdasarkan tanggal upload terbaru. Menampilkan nama, ukuran, tanggal, status, dan aksi. |
| **Status badge** | `✅ Siap` = hijau, `⏳ Memproses` = kuning dengan progress, `❌ Gagal` = merah. |
| **Tombol hapus** | Hanya muncul pada file berstatus Siap atau Gagal. Tidak muncul saat file masih diproses/diunggah. |
| **Dialog konfirmasi** | Modal dengan overlay. Harus klik `[Hapus]` untuk konfirmasi. |
| **Chat bubble (pelanggan)** | Rata kanan, warna background berbeda dari bot. |
| **Chat bubble (bot)** | Rata kiri, menyertakan blok sumber referensi. |
| **Blok sumber** | Muncul di bawah jawaban bot. Menampilkan nama file dan halaman/bagian jika tersedia. |
| **Input chat** | Placeholder "Ketik pertanyaan...". Kirim dengan Enter atau klik tombol. Disabled saat bot memproses. |
| **Tombol kirim** | Disabled saat input kosong atau bot sedang memproses. |
| **Pesan selamat datang** | Hanya muncul saat belum ada percakapan. Hilang setelah pesan pertama dikirim. |
| **Contoh pertanyaan** | Bisa diklik untuk langsung mengisi input dan mengirim. |
| **Error banner** | Muncul sementara di atas daftar file (upload error) atau inline di chat (chat error). |

---

# Complete Wireframe Design (Low-Fidelity) — Janasku RAG Chatbot MVP

This document presents complete wireframes for all pages and all possible states in the MVP application. Wireframes use ASCII art as low-fidelity representation.

## Global Navigation

Simple navigation at the top, used on all pages.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
└─────────────────────────────────────────────────────┘
```

- Brand logo/name on the left
- Two navigation links on the right
- Active page indicated with underline or different color

---

## Knowledge Base Page (`/knowledge-base`)

### State 1: Empty (No Files Yet)

First-time view when no files have been uploaded.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base                                     │
│                                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│  ╎                                             ╎   │
│  ╎   📁  Drag & drop files here                ╎   │
│  ╎       or click to select files              ╎   │
│  ╎                                             ╎   │
│  ╎       Supported: PDF, TXT, DOCX            ╎   │
│  ╎       Max: 10 MB per file                   ╎   │
│  ╎                                             ╎   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                                                     │
│  No files uploaded yet.                             │
│  Upload your first file so the chatbot can          │
│  answer customer questions.                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### State 2: Upload In Progress

While files are being uploaded and processed.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base                                     │
│                                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│  ╎   📁  Drag & drop files here                ╎   │
│  ╎       or click to select files              ╎   │
│  ╎       Supported: PDF, TXT, DOCX            ╎   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                                                     │
│  Uploaded Files                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ product-guide.pdf          1.2 MB    27 Feb  │   │
│  │ ✅ Ready                              [Delete]│   │
│  ├──────────────────────────────────────────────┤   │
│  │ faq-janasku.txt            340 KB    27 Feb  │   │
│  │ ⏳ Processing...                             │   │
│  │ ░░░░░░░░░░░░░░████████░░░░░░░░░░░░  60%     │   │
│  ├──────────────────────────────────────────────┤   │
│  │ ingredients.docx           890 KB    27 Feb  │   │
│  │ ⬆️ Uploading...                               │   │
│  │ ░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░  20%     │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Ready files show `[Delete]` button
- Processing/uploading files show progress bar
- Delete button hidden while file is still processing

### State 3: Populated (Files with Various Statuses)

Normal state after several files have been uploaded.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base                                     │
│                                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│  ╎   📁  Drag & drop files here                ╎   │
│  ╎       or click to select files              ╎   │
│  ╎       Supported: PDF, TXT, DOCX            ╎   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                                                     │
│  Uploaded Files (3 files)                           │
│  ┌──────────────────────────────────────────────┐   │
│  │ product-guide.pdf          1.2 MB    27 Feb  │   │
│  │ ✅ Ready                              [Delete]│   │
│  ├──────────────────────────────────────────────┤   │
│  │ faq-janasku.txt            340 KB    26 Feb  │   │
│  │ ✅ Ready                              [Delete]│   │
│  ├──────────────────────────────────────────────┤   │
│  │ ingredients.docx           890 KB    25 Feb  │   │
│  │ ✅ Ready                              [Delete]│   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### State 4: Upload Error

When a file fails to upload or process.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base                                     │
│                                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│  ╎   📁  Drag & drop files here                ╎   │
│  ╎       or click to select files              ╎   │
│  ╎       Supported: PDF, TXT, DOCX            ╎   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ ❌ Failed to upload "report.xlsx"            │   │
│  │    Unsupported file format.                  │   │
│  │    Please use PDF, TXT, or DOCX.            │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Uploaded Files (2 files)                           │
│  ┌──────────────────────────────────────────────┐   │
│  │ product-guide.pdf          1.2 MB    27 Feb  │   │
│  │ ✅ Ready                              [Delete]│   │
│  ├──────────────────────────────────────────────┤   │
│  │ ingredients.docx           890 KB    25 Feb  │   │
│  │ ❌ Processing failed                 [Delete]│   │
│  │    [Retry]                                   │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Upload error (wrong format) appears as banner above file list, auto-dismisses
- Processing error appears inline on the file row with `[Retry]` option

### Interaction: Delete Confirmation Dialog

Appears when owner clicks `[Delete]`.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░  ┌────────────────────────────────────┐  ░░░  │
│  ░░░  │  Delete File?                      │  ░░░  │
│  ░░░  │                                    │  ░░░  │
│  ░░░  │  "product-guide.pdf" will be       │  ░░░  │
│  ░░░  │  removed from the knowledge base.  │  ░░░  │
│  ░░░  │  The chatbot will no longer be     │  ░░░  │
│  ░░░  │  able to reference this file.      │  ░░░  │
│  ░░░  │                                    │  ░░░  │
│  ░░░  │         [Cancel]  [Delete]         │  ░░░  │
│  ░░░  └────────────────────────────────────┘  ░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Background overlay (░) dims the content behind
- `[Delete]` button is red/destructive
- `[Cancel]` closes the dialog with no action

### Interaction: Active Drag & Drop

When a file is dragged over the upload area.

```
  ┌═════════════════════════════════════════════┐
  ║                                             ║
  ║   📁  Drop your file here!                  ║
  ║                                             ║
  └═════════════════════════════════════════════┘
```

- Border changes to thick/highlighted
- Text changes to "Drop your file here!"

---

## Chat Page (`/chat`)

### State 1: Empty (No Conversation Yet)

Initial view when a customer first opens the chat page.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                                                     │
│                   🤖                                │
│                                                     │
│           Hi! I'm the Janasku chatbot.              │
│           Ask me anything about                      │
│           our products.                              │
│                                                     │
│           Example questions:                         │
│           • "What is Janasku made of?"              │
│           • "How do I take Janasku?"                │
│           • "Is it safe for pregnant women?"        │
│                                                     │
│                                                     │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │ Type your question...             │ │ Send │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Welcome message centered in the chat area
- Example questions are clickable to auto-fill and send
- `[Send]` button disabled when input is empty

### State 2: Active Conversation (with Source References)

After the customer starts asking questions.

```
┌─────────────────────────────────────────────────────┐
│  🧃 Janasku          [Knowledge Base]   [Chat]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│                What is Janasku made of?  👤         │
│                                                     │
│  🤖  Janasku is made from 3 main ingredients:       │
│      1. Ginger (Jahe) — warms the body              │
│      2. Pineapple (Nanas) — vitamin C source        │
│      3. Turmeric (Kunyit) — anti-inflammatory       │
│                                                     │
│      These three ingredients are processed           │
│      using modern methods while preserving           │
│      traditional benefits.                           │
│                                                     │
│      ┌────────────────────────────────────┐         │
│      │ 📎 Sources:                        │         │
│      │ • product-guide.pdf (p. 2-3)       │         │
│      └────────────────────────────────────┘         │
│                                                     │
│                       How do I take it?  👤         │
│                                                     │
│  🤖  How to take Janasku:                            │
│      • Adults: 1 tablespoon, 2x daily               │
│      • Can be taken directly or mixed               │
│        with warm water                               │
│      • Best taken after meals                        │
│                                                     │
│      ┌────────────────────────────────────┐         │
│      │ 📎 Sources:                        │         │
│      │ • product-guide.pdf (p. 5)         │         │
│      │ • faq-janasku.txt                  │         │
│      └────────────────────────────────────┘         │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │ Type your question...             │ │ Send │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Customer messages aligned right, bot messages aligned left
- Each bot answer includes a source reference block
- Chat area scrollable to see previous messages

### State 3: Bot Typing

While the chatbot is processing a response.

```
│                                                     │
│                Is it safe for children?  👤         │
│                                                     │
│  🤖  ●●● Typing...                                  │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │                                   │ │ ···  │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
```

- Animated dots (●●●) indicate bot is processing
- Input field disabled while bot is processing
- Send button shows loading indicator (···)

### State 4: Bot Doesn't Know the Answer

When the question is outside the knowledge base.

```
│                                                     │
│                    How much does it cost?  👤       │
│                                                     │
│  🤖  Sorry, I don't have information about          │
│      Janasku's pricing yet. This information        │
│      is not available in our knowledge base.         │
│                                                     │
│      Please contact the owner directly for           │
│      pricing information.                            │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │ Type your question...             │ │ Send │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
```

- No source reference block (no relevant file found)
- Response is polite and directs to owner for out-of-scope questions

### State 5: Error (Failed to Get Response)

When there's a connection or server issue.

```
│                                                     │
│                      What is Janasku?  👤           │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ ❌ Failed to get a response. Please try      │   │
│  │    again.                     [Try Again]    │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌───────────────────────────────────┐ ┌──────┐    │
│  │ Type your question...             │ │ Send │    │
│  └───────────────────────────────────┘ └──────┘    │
│                                                     │
```

- Error message appears as inline block in chat area
- `[Try Again]` button resends the last question

---

## Component Notes

| Component | Behavior |
|-----------|----------|
| **Nav bar** | Always visible at top. Active link is highlighted. |
| **Drop zone** | Border changes when file is dragged over it. Click opens file picker. |
| **File list** | Sorted by most recent upload date. Shows name, size, date, status, and action. |
| **Status badge** | `✅ Ready` = green, `⏳ Processing` = yellow with progress, `❌ Failed` = red. |
| **Delete button** | Only visible on files with Ready or Failed status. Hidden while file is processing/uploading. |
| **Confirmation dialog** | Modal with overlay. Must click `[Delete]` to confirm. |
| **Chat bubble (customer)** | Right-aligned, different background color from bot. |
| **Chat bubble (bot)** | Left-aligned, includes source reference block. |
| **Source block** | Appears below bot's answer. Shows filename and page/section if available. |
| **Chat input** | Placeholder "Type your question...". Submit with Enter or click button. Disabled while bot is processing. |
| **Send button** | Disabled when input is empty or bot is processing. |
| **Welcome message** | Only shown when no conversation exists. Disappears after first message is sent. |
| **Example questions** | Clickable to auto-fill input and send. |
| **Error banner** | Appears temporarily above file list (upload error) or inline in chat (chat error). |
