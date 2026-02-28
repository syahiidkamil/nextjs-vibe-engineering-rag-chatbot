import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMBEDDING_MODEL = 'gemini-embedding-001';
const CHAT_MODEL = 'gemini-1.5-flash';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Ambil pesan terakhir dari user
    const lastUserMessageOpt = [...messages].reverse().find(m => m.role === 'user');
    const userQuery = lastUserMessageOpt?.parts?.[0]?.text;

    let ragContext = "";

    // Lakukan RAG jika Supabase diatur (di tahap MVP bisa saja belum diatur)
    if (SUPABASE_URL && SUPABASE_KEY && userQuery) {
      try {
        // 1. Convert user query to embedding via Gemini API
        const embedResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text: userQuery }] },
            taskType: "RETRIEVAL_QUERY",
            output_dimensionality: 768
          })
        });

        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          const queryEmbedding = embedData.embedding?.values;

          if (queryEmbedding) {
            // 2. Search Supabase PGVector
            const { data: documents, error } = await supabase.rpc('match_documents', {
              query_embedding: queryEmbedding,
              match_threshold: 0.5,
              match_count: 3
            });

            if (!error && documents && documents.length > 0) {
              const matchedTexts = documents.map((doc: any) => doc.content);
              ragContext = `\nDokumen Referensi Pengetahuan:\n${matchedTexts.join("\n---\n")}\n`;
            }
          }
        }
      } catch (err) {
        console.error("Gagal melakukan proses RAG:", err);
      }
    }

    // 3. Format payload untuk Gemini 1.5 Flash Chat
    // Gemini Flash butuh array dari 'contents' dengan object berbentuk {role, parts: [{text}]}
    // Kita akan modifikasi pesan terakhir atau tambahkan System Prompt instruksi RAG as context.

    const systemInstruction = "Anda adalah Janasku Assistant, AI untuk bisnis Jamu Modern dengan bahan baku Jahe, Nanas, dan Kunyit. Jawab pertanyaan pelanggan dengan ramah, dan pastikan Anda MENJAWAB HANYA BERDASARKAN DOKUMEN REFERENSI PENGETAHUAN yang diberikan jika ada. Jika dokumen referensi meminta handoff atau jika pertanyaan tidak berkaitan dengan Janasku, arahkan untuk menghubungi Admin. JANGAN berhalusinasi informasi di luar dokumen.";
    
    // Copy the messages history
    const chatHistory = [...messages];
    
    // Modifikasi pesan pertama dari user untuk menyisipkan system instruction + konteks RAG
    if (chatHistory.length > 0 && chatHistory[0].role === 'user') {
      const originalText = chatHistory[0].parts[0].text;
      chatHistory[0].parts[0].text = `[INSTRUKSI SISTEM]: ${systemInstruction}\n${ragContext}\n[PERTANYAAN PENGGUNA]: ${originalText}`;
    }

    // 4. Panggil Gemini 1.5 Flash
    const chatResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: chatHistory,
      })
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.text();
      console.error("Gemini Error API:", errorData);
      return NextResponse.json({ error: 'Gagal komunikasi dengan AI' }, { status: 500 });
    }

    const responseData = await chatResponse.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
