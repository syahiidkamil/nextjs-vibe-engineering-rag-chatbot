# Sistem Desain, Tema, dan Warna — Janasku RAG Chatbot MVP

Dokumen ini menjadi pedoman utama untuk pengembangan UI/UX dari aplikasi Janasku RAG Chatbot berdasarkan filosofi produk "Jahe, Nanas, Kunyit", dirancang untuk bekerja secara harmonis dengan **Tailwind CSS v4** dan **Shadcn UI** (menggunakan format warna OKLCH).

---

## 1. Filosofi Tema & Warna Brand (Janasku)

Brand "Janasku" identik dengan rempah dan bahan alami tradisional yang hangat namun menyegarkan. Kita akan menggunakan tiga elemen utama sebagai basis palet warna:

- **Kunyit (Turmeric) — Primary:** Warna oranye kekuningan yang kuat, hangat, dan mencolok. Melambangkan energi, kesehatan, dan anti-inflamasi alami.
- **Nanas (Pineapple) — Secondary / Accent:** Warna kuning cerah yang menyegarkan. Melambangkan rasa manis alami, kesegaran, dan keramahan.
- **Jahe (Ginger) — Background / Muted:** Warna krem kecoklatan yang lembut. Melambangkan kehangatan, kenyamanan, dan sifat *grounding* (membumi) dari jamu tradisional.

### Pemetaan Warna Shadcn UI

Aplikasi ini menggunakan sistem variabel CSS OKLCH bawaan Shadcn Tailwind CSS di `src/app/globals.css`. Pemetaan warna di bawah ini disesuaikan dengan skema Shadcn standar untuk mempertahankan kompatibilitas *copy-paste* komponen.

> **Catatan:** Nilai warna OKLCH aktual didefinisikan di `src/app/globals.css`. Tabel di bawah mencantumkan nilai light mode; dark mode menggunakan hue yang sama dengan lightness lebih tinggi.

| Peran (Shadcn) | Nama Konseptual | Nilai OKLCH (Light) | Penggunaan Utama |
| --- | --- | --- | --- |
| `--primary` | **Kunyit (Turmeric)** | `oklch(0.620 0.220 45)` | Tombol utama, aksi aktif, user chat bubble, navbar brand |
| `--destructive` | **Merah (Red)** | `oklch(0.577 0.245 27.325)` | Tombol hapus, error badge, peringatan — tetap merah |
| `--secondary` | **Nanas (Pineapple)** | `oklch(0.967 0.001 286.375)` | Tombol sekunder, hover states sekunder |
| `--background` | **Jahe Light (Ginger)** | `oklch(1 0 0)` | Latar belakang utama aplikasi (Light Mode) |
| `--muted` / `--card` | **Jahe Muted** | `oklch(0.967 0.001 286.375)` | Latar belakang kartu, Chat Bubble bot |
| `--foreground` | **Arang (Charcoal)** | `oklch(0.141 0.005 285.823)` | Teks utama |

---

## 2. Tipografi

Sistem tipografi difokuskan pada keterbacaan (readability) yang tinggi karena aplikasi ini sangat bergantung pada teks (chatting dan membaca dokumen).

*   **Font Utama (Sans-serif):** `Inter` atau `Geist Sans` (bawaan Next.js).
*   **Font Monospace:** `Geist Mono` (untuk kode abu-abu/kutipan teknis).

**Struktur Ukuran:**
*   `h1`: `text-2xl font-bold` — Judul Halaman (contoh: "Knowledge Base")
*   `h2`: `text-xl font-semibold` — Judul Section (contoh: Welcome Message Chatbot)
*   `h3`: `text-lg font-semibold` — Judul sub-komponen
*   `p` (Body): `text-base` (16px) — Teks chat utama dari Bot dan User. Keterbacaan optimal.
*   `small`: `text-sm text-muted-foreground` — Metadata, tanggal file, ukuran file, referensi sumber.

---

## 3. Komponen Utama (Adaptasi Shadcn)

Dalam tahap eksekusi, kita akan menggunakan *Primitives* dari Shadcn UI yang dibalut dengan warna Kunyit/Kuning:

### A. Tombol (Buttons)
*   **Primary Button:** Latar `--primary` (Kunyit/Oranye), teks putih. Hover efek menggelap. Digunakan untuk tombol **[Kirim]** atau **[Pilih File]**.
*   **Secondary Button:** Latar transparan dengan border atau berlatar `--secondary` (Kuning Nanas/Muted). Digunakan untuk **Suggestion Chips** atau tombol **[Batal]**.
*   **Destructive Button:** Tetap menggunakan `--destructive` (Merah). Untuk peringatan **[Hapus File]**.

### B. Chat Bubbles
*   **Bot Bubble:** Latar `--muted` atau `--secondary` (Abu-abu sangat muda/Krem). Rata kiri. Melambangkan keramahan pelayanan (Nanas/Jahe).
*   **User Bubble:** Latar `--primary` (Kunyit Oranye) dengan teks putih/terang. Rata kanan.
*   **Referensi Sumber (Source Block):** Menggunakan desain Card kecil di dalam *Bot Bubble* dengan border yang jelas.

### C. Kartu (Cards) & Daftar (Lists)
*   Menggunakan komponen `Card` dari Shadcn dengan warna latar `--card` dan sedikit bayangan (*shadow-sm*).
*   Tepi melengkung sedang (`--radius: 0.65rem`), memberi kesan modern dan halus, tidak kaku.

---

## 4. Desain Dark Mode (Mode Gelap)

Mode gelap memberikan pengalaman yang lebih intim dan mengistirahatkan mata, cocok untuk membaca teks chat malam hari.

*   Background menggunakan hitam keabuan yang sangat gelap (bukan *pure black*).
*   Warna primer (Kunyit) dibuat sedikit lebih terang dan *vibrant* agar kontras dengan latar belakang gelap.
*   Warna teks menjadi putih tulang/abu-abu terang (`--foreground` di mode dark).

## 5. Ilustrasi & Ikonografi

*   Gunakan ikonografi tipe **Lucide Icons** (standar Shadcn UI).
*   Ikon bersifat *stroke* (garisan), ketebalan medium, minimalis namun ramah.
*   Contoh ikon yang butuh disiapkan: 
    *   `Bot` / `MessageSquare` untuk representasi chatbot
    *   `User` untuk pengguna
    *   `UploadCloud` / `FileUp` untuk unggah file
    *   `Trash2` untuk hapus
    *   `FileText` untuk menandakan dokumen

## 6. Animasi (Micro-interactions)

Untuk mencapai kualitas *vibe engineering*, pastikan aplikasi terasa responsif:
*   **Typing Indicator:** Menggunakan animasi `bounce` atau perpindahan opasitas bergelombang saat bot sedang "*thinking*".
*   **Fade-in:** Konten chat bot baru muncul dengan efek `fade-in` dari bawah secara perlahan (*easing out*).
*   **Hover States:** Skala kecil (`scale-105`) atau transisi warna halus pada tombol *chips* pertanyaan.

*(Sistem desain ini sejalan dengan kode `globals.css` yang berbasis OKLCH yang ada di sistem saat ini, dimana variabel `--primary` sudah diatur ke arah nuansa Hangat/Oranye. Kita tinggal men-generate/mengimpor komponen Shadcn yang dibutuhkan).*
