# Desain Wireframe Detail Rendah (Low-Fidelity)
## Solusi: Chatbot Janasku dengan Fitur Upload (MVP)

Karena Anda menginginkan fleksibilitas untuk mengunggah file (PDF/TXT) langsung dari antarmuka, aplikasi MVP ini akan dibagi menjadi dua bagian utama (layar ganda atau *split-screen*) untuk kemudahan penggunaan oleh admin sekaligus pengujian *chat*.

```text
+-------------------------------------------------------------------------------+
|  Janasku Assistant Dashboard                                                  |
+-------------------------------------------------------------------------------+
|                                      |                                        |
|  [Area Admin / Pengaturan Konteks]   |  [Area Simulasi Chatbot]               |
|                                      |                                        |
|  1. Upload Dokumen Knowledge Base    |  +----------------------------------+  |
|  +--------------------------------+  |  | [Header]                         |  |
|  | Tarik dan lepas (drag & drop)  |  |  | Janasku Assistant                |  |
|  | file PDF/TXT/DOCX ke sini      |  |  +----------------------------------+  |
|  |                                |  |  |                                  |  |
|  |     [ Atau Pilih File ]        |  |  |  [Bot] AI Janasku                |  |
|  +--------------------------------+  |  |  Halo! Ada yang bisa dibantu     |  |
|                                      |  |  terkait Jamu Jahe Nanas Kunyit  |  |
|  Dokumen Aktif:                      |  |  kita hari ini?                  |  |
|  - SOP_Balas_Chat.pdf (Hapus)        |  |  +-----------------------------+ |  |
|  - Daftar_Harga_Janasku.txt (Hapus)  |  |                                  |  |
|                                      |  |                       [Pengguna] |  |
|  *File yang diunggah akan otomatis   |  |                       Berapa     |  |
|  dijadikan acuan jawaban chatbot     |  |                       harganya?  |  |
|  di sebelah kanan.                   |  |                       +--------+ |  |
|                                      |  |                                  |  |
|                                      |  |  [Bot] AI Janasku                |  |
|                                      |  |  Harga botol 250ml Rp 15.000 ya. |  |
|                                      |  |                                  |  |
|                                      |  +----------------------------------+  |
|                                      |  | [Ketik pesan pengujian...] [Kirim]  |
|                                      |  +----------------------------------+  |
|                                      |                                        |
+-------------------------------------------------------------------------------+
```

### Penjelasan Elemen

1. **Area Kiri (Admin / Pengaturan Konteks)**:
   - Dikhususkan bagi Anda (pemilik) untuk mengunggah dokumen pedoman, SOP, atau info terbaru Janasku.
   - Fitur *upload* mendukung klik atau geser file (*drag & drop*).
   - Terdapat daftar "Dokumen Aktif" untuk melihat file apa saja yang sedang dipakai otak *chatbot* saat ini.
2. **Area Kanan (Simulasi Chatbot)**:
   - Antarmuka *chat* persis seperti yang akan dilihat oleh pelanggan.
   - Bot di sebelah kanan akan **langsung** menggunakan konteks dari dokumen apa pun yang baru saja Anda unggah di sebelah kiri.

---

# Low-Fidelity Wireframe Design
## Solution: Janasku Chatbot with Upload Feature (MVP)

Since you requested the flexibility to upload files (PDF/TXT) directly from the interface, this MVP application will be divided into two main sections (split-screen layout) for easy administration and chat testing.

```text
+-------------------------------------------------------------------------------+
|  Janasku Assistant Dashboard                                                  |
+-------------------------------------------------------------------------------+
|                                      |                                        |
|  [Admin Area / Context Settings]     |  [Chatbot Simulation Area]             |
|                                      |                                        |
|  1. Upload Knowledge Base Documents  |  +----------------------------------+  |
|  +--------------------------------+  |  | [Header]                         |  |
|  | Drag and drop PDF/TXT/DOCX     |  |  | Janasku Assistant                |  |
|  | files here                     |  |  +----------------------------------+  |
|  |                                |  |  |                                  |  |
|  |     [ Or Select File ]         |  |  |  [Bot] Janasku AI                |  |
|  +--------------------------------+  |  |  Hello! How can I help you       |  |
|                                      |  |  regarding our Ginger Pineapple  |  |
|  Active Documents:                   |  |  Turmeric drink today?           |  |
|  - SOP_Reply.pdf (Remove)            |  |  +-----------------------------+ |  |
|  - Price_List_Janasku.txt (Remove)   |  |                                  |  |
|                                      |  |                           [User] |  |
|  *Uploaded files will automatically  |  |                         How much |  |
|  become the source of truth for the  |  |                         is it?   |  |
|  chatbot on the right.               |  |                       +--------+ |  |
|                                      |  |                                  |  |
|                                      |  |  [Bot] Janasku AI                |  |
|                                      |  |  The 250ml bottle is Rp 15,000.  |  |
|                                      |  |                                  |  |
|                                      |  +----------------------------------+  |
|                                      |  | [Type test message...]     [Send]   |
|                                      |  +----------------------------------+  |
|                                      |                                        |
+-------------------------------------------------------------------------------+
```

### Elements Detail

1. **Left Area (Admin / Context Settings)**:
   - Dedicated space for you (the owner) to upload Janasku guidelines, SOPs, or the latest information.
   - The upload feature supports clicking to select or drag & drop.
   - Contains an "Active Documents" list to see exactly which files are currently feeding the chatbot's brain.
2. **Right Area (Chatbot Simulation)**:
   - The chat interface exactly as the customer would see it.
   - The bot on the right will **immediately** utilize the context from whatever document you just uploaded on the left.
