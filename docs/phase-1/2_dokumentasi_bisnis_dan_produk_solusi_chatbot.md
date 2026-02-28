# Business and Product Requirement Document (BPRD)
## Solusi: Chatbot Berbasis RAG (MVP / Prototype)

### 1. Tujuan Bisnis (Business Goals)
- **Tujuan Utama**: Menghemat waktu pemilik bisnis Janasku (Jamu Modern Jahe Nanas Kunyit) dalam merespons *chat* berulang dari pelanggan hingga 70-80%.
- **Tujuan Sekunder**: Memastikan jawaban *chatbot* selalu konsisten, aman, dan mematuhi SOP Janasku tanpa risiko memberikan informasi palsu (mengurangi halusinasi AI).
- **Target MVP**: Membuktikan kelayakan (*feasibility*) bahwa AI chatbot mampu menjawab pertanyaan pelanggan berdasarkan panduan dokumen secara akurat sebelum diintegrasikan ke platform *chat* sungguhan (seperti WhatsApp atau Instagram).

### 2. Lingkup Produk (Product Scope) - Batasan MVP
Karena ini adalah tahap **Minimum Viable Product (MVP) atau Prototype**, berikut adalah batasan sistem yang akan dibangun:
- **Platform**: Aplikasi web sederhana berbasis Next.js untuk simulasi percakapan (bukan integrasi langsung ke WhatsApp/IG).
- **Lingkup Pengguna**: Ada dua peran: (a) Simulasi Admin untuk mengunggah dokumen *Knowledge Base* (PDF/TXT) secara fleksibel melalui *browser*, (b) Simulasi Pelanggan untuk *chat*.
- **Pengetahuan (Knowledge Base)**: *Knowledge Base* tidak dipaku di dalam *folder* kode, melainkan dapat diunggah langsung melalui antarmuka *web* agar pemilik (Janasku) lebih fleksibel mengubah SOP.
- **Teknologi**: Menggunakan arsitektur RAG sederhana (LLM seperti Gemini yang mendukung parsing dokumen + penyimpanan file sementara/*in-memory* state).
- **Fitur Chat**: antarmuka (*interface*) chat sederhana (input teks dan area untuk melihat balasan *chatbot*).
- **Handoff Manual**: Pada MVP ini, jika bot tidak bisa menjawab, bot hanya akan memberikan balasan "Silakan hubungi admin di nomor WhatsApp XXXXX", belum ada sistem *routing* otomatis ke admin.

### 3. Di Luar Lingkup MVP (Out of Scope for MVP)
Fitur-fitur berikut **tidak** akan dikembangkan di fase ini:
- Integrasi ke WhatsApp API, Instagram DM, atau Facebook Messenger.
- Dashboard admin yang kompleks untuk analitik percakapan.
- Sistem pemesanan dan pembayaran langsung dari dalam *chat*.
- Penanganan multi-bahasa yang kompleks (fokus pada Bahasa Indonesia).

### 4. Metrik Keberhasilan (Success Metrics) MVP
- **Akurasi**: Chatbot mampu menjawab pertanyaan umum (komposisi, harga, cara simpan) 100% sesuai dengan teks di *Knowledge Base*.
- **Keamanan**: Jika ditanya hal di luar konteks Janasku (misal: cuaca atau berita politik), chatbot akan menolak menjawab dengan sopan.

---

# Business and Product Requirement Document (BPRD)
## Solution: RAG-Based Chatbot (MVP / Prototype)

### 1. Business Goals
- **Primary Goal**: Save the business owner's time by handling 70-80% of repetitive customer inquiries for Janasku (Modern Jahe Nanas Kunyit herbal drink).
- **Secondary Goal**: Ensure the chatbot's answers are always consistent, safe, and comply with Janasku's SOPs without the risk of providing false information (reducing AI hallucination).
- **MVP Target**: Prove the feasibility that an AI chatbot is capable of answering customer questions accurately based on document guidelines before integrating it into real chat platforms (like WhatsApp or Instagram).

### 2. Product Scope - MVP Boundaries
Since this is a **Minimum Viable Product (MVP) or Prototype** phase, here are the boundaries of the system to be built:
- **Platform**: A simple Next.js-based web application for conversation simulation (not direct integration into WhatsApp/IG).
- **User Mapping**: There are two implicit roles: (a) Admin Simulation to flexibly upload *Knowledge Base* documents (PDF/TXT) directly through the browser, (b) Customer Simulation for chatting.
- **Knowledge Base**: The *Knowledge Base* is not hardcoded into a code folder, but can be uploaded directly via the web interface to give the owner (Janasku) flexibility in modifying SOPs.
- **Technology**: Uses a basic RAG architecture (LLM like Gemini with document parsing support + temporary file storage/in-memory state).
- **Chat Features**: A simple chat interface (text input and a chat history display area).
- **Manual Handoff**: For this MVP, if the bot cannot answer, it will simply reply "Please contact the admin at WhatsApp number XXXXX", without an automated routing system to the human admin yet.

### 3. Out of Scope for MVP
The following features will **not** be developed in this phase:
- Integration with WhatsApp API, Instagram DM, or Facebook Messenger.
- Complex admin dashboard for conversation analytics.
- Direct ordering and payment system within the chat.
- Complex multi-language handling (focusing solely on Indonesian).

### 4. MVP Success Metrics
- **Accuracy**: The chatbot is able to answer common questions (ingredients, price, storage instructions) with 100% accuracy according to the Knowledge Base text.
- **Safety**: If asked about topics outside the context of Janasku (e.g., the weather or political news), the chatbot will politely refuse to answer.
