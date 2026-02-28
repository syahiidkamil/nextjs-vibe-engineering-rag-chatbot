# Dokumentasi Masalah Bisnis: Janasku

## Latar Belakang
Janasku adalah bisnis yang memproduksi dan menjual minuman jamu modern dengan bahan baku utama Jahe, Nanas, dan Kunyit.

## Permasalahan Utama
1. **Keterbatasan Finansial untuk SDM**: Saat ini, bisnis belum memiliki kapasitas finansial yang cukup untuk mempekerjakan dan membayar karyawan (*customer service*) secara layak.
2. **Kewalahan Menangani *Chat* Pelanggan**: Karena keterbatasan SDM, pihak bisnis merasa sangat kewalahan dalam menanggapi tingginya volume pesan masuk dari pelanggan secara manual.
3. **Kekhawatiran Adopsi Teknologi Chatbot**: Pemilik menyadari bahwa bisnis lain menggunakan *chatbot* sebagai solusi. Namun, terdapat kekhawatiran besar (keraguan) untuk menggunakannya karena takut *chatbot* tersebut akan menjawab pertanyaan pelanggan secara sembarangan, tidak sesuai dengan pedoman, dan melanggar Standar Operasional Prosedur (SOP) Janasku.

## Pilihan Solusi

Berikut adalah beberapa pendekatan solusi yang dapat dipertimbangkan untuk merespons masalah di atas:

### 1. Chatbot Berbasis RAG (*Retrieval-Augmented Generation*)
- **Deskripsi**: Mengembangkan *chatbot* AI pintar yang "dibatasi" pengetahuannya. Chatbot ini hanya diizinkan mengambil informasi dari dokumen pedoman/SOP Janasku, FAQ produk, dan detail komposisi yang sudah disediakan oleh pemilik.
- **Kelebihan**: AI merespons dengan natural seperti manusia, namun sangat aman karena tidak akan mengarang jawaban di luar konteks atau SOP Janasku.
- **Kekurangan**: Memerlukan waktu di awal untuk menyusun dokumen *Knowledge Base* (basis pengetahuan) yang lengkap dan rapi.

### 2. Chatbot *Rule-Based* (Berbasis Aturan / Menu)
- **Deskripsi**: Menggunakan *chatbot* konvensional tanpa AI (kecerdasan buatan) generatif. Pelanggan harus memilih opsi yang disediakan (contoh: "Balas 1 untuk Info Harga", "Balas 2 untuk Komposisi").
- **Kelebihan**: 100% terjamin aman, jawaban benar-benar paten sesuai yang diketik oleh pemilik, tidak ada risiko AI berhalusinasi.
- **Kekurangan**: Interaksi terasa kaku dan seperti robot. Pelanggan seringkali merasa frustrasi jika pertanyaan spesifik mereka tidak ada di dalam menu pilihan.

### 3. Sistem *Hybrid* (AI Chatbot dengan *Human Handoff*)
- **Deskripsi**: Menerapkan AI chatbot RAG (Solusi 1) untuk menangani 80% pertanyaan repetitif harian (harga, pengiriman, komposisi). Namun, jika sistem mendeteksi keluhan serius atau pelanggan meminta bicara dengan admin manusia, *chatbot* akan langsung berhenti merespons dan meneruskan (*handoff*) percakapan ke pemilik bisnis.
- **Kelebihan**: Menghemat waktu pembalasan *chat* secara drastis, sekaligus memastikan bahwa isu yang sensitif atau melanggar SOP tetap ditangani langsung oleh keputusan manusia.
- **Kekurangan**: Pemilik masih harus meluangkan sebagian kecil waktu setiap harinya untuk merespons notifikasi *handoff*.

---

# Business Problem Documentation: Janasku

## Background
Janasku is a business that produces and sells modern traditional herbal drinks (jamu) with the main ingredients being Ginger (Jahe), Pineapple (Nanas), and Turmeric (Kunyit).

## Main Problems
1. **Financial Limitations for Human Resources**: Currently, the business does not have the financial capacity to hire and properly pay employees (customer service representatives).
2. **Overwhelmed by Customer Chats**: Due to the lack of dedicated staff, the business owner is completely overwhelmed by manually responding to the high volume of incoming messages from customers.
3. **Concerns Over Chatbot Adoption**: The owner is aware that other businesses use chatbots as a solution. However, there is a major concern that an AI chatbot might respond arbitrarily, failing to adhere to the business guidelines and Standard Operating Procedures (SOP) of Janasku.

## Solution Options

Here are several solution approaches that can be considered to address the problems above:

### 1. RAG (Retrieval-Augmented Generation) Based Chatbot
- **Description**: Develop a smart AI chatbot whose knowledge is "restricted". This chatbot is only allowed to retrieve information from provided Janasku SOP documents, product FAQs, and composition details supplied by the owner.
- **Pros**: The AI responds naturally like a human, but it is very secure because it will not fabricate answers outside the context or Janasku's SOPs.
- **Cons**: Requires initial time investment to compile comprehensive and well-organized Knowledge Base documents.

### 2. Rule-Based Chatbot (Menu-Driven)
- **Description**: Use a conventional chatbot without generative AI. Customers must choose from provided options (e.g., "Reply 1 for Pricing Info", "Reply 2 for Ingredients").
- **Pros**: 100% guaranteed safety; answers are strictly pre-written by the owner, completely eliminating the risk of AI hallucination.
- **Cons**: The interaction feels rigid and robotic. Customers often get frustrated if their specific question isn't present in the menu options.

### 3. Hybrid System (AI Chatbot with Human Handoff)
- **Description**: Implement a RAG AI chatbot (Solution 1) to handle 80% of repetitive daily queries (pricing, shipping, ingredients). However, if the system detects a serious complaint or if the customer explicitly asks to speak with a human admin, the chatbot will immediately stop responding and route (handoff) the conversation to the business owner.
- **Pros**: Drastically reduces the time spent replying to chats, while ensuring that sensitive issues or edge-cases that might violate SOPs are handled directly by human judgment.
- **Cons**: The owner still needs to allocate a small fraction of time each day to respond to handoff notifications.
