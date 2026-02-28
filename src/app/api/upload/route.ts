import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFParse } from 'pdf-parse';

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMBEDDING_MODEL = 'gemini-embedding-001';
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

function splitIntoChunks(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= CHUNK_SIZE) return [cleaned];

  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    const end = start + CHUNK_SIZE;
    chunks.push(cleaned.slice(start, end));
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function extractText(file: File, buffer: ArrayBuffer): Promise<string> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    const pdf = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await pdf.getText();
    await pdf.destroy();
    return result.text;
  }
  return new TextDecoder().decode(buffer);
}

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ error: 'Missing environment variables.' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const textContent = await extractText(file, fileBuffer);

    if (!textContent.trim()) {
      return NextResponse.json({ error: 'Dokumen kosong atau tidak dapat diekstrak.' }, { status: 400 });
    }

    const chunks = splitIntoChunks(textContent);

    for (let i = 0; i < chunks.length; i++) {
      // Generate embedding for this chunk
      const embedResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text: chunks[i] }] },
            taskType: 'RETRIEVAL_DOCUMENT',
            output_dimensionality: 768,
          }),
        }
      );

      if (!embedResponse.ok) {
        const errorText = await embedResponse.text();
        console.error(`Gemini Embed Error (chunk ${i}):`, errorText);
        return NextResponse.json({ error: 'Gagal membuat vektor dokumen' }, { status: 500 });
      }

      const embedData = await embedResponse.json();
      const embeddingValues = embedData.embedding?.values;

      if (!embeddingValues) {
        return NextResponse.json({ error: 'Embedding kosong dari Gemini' }, { status: 500 });
      }

      // Store chunk in Supabase
      const { error: dbError } = await supabase.from('documents').insert({
        content: chunks[i],
        metadata: {
          filename: file.name,
          type: file.type,
          chunkIndex: i,
          totalChunks: chunks.length,
        },
        embedding: embeddingValues,
      });

      if (dbError) {
        console.error(`Supabase Error (chunk ${i}):`, dbError);
        return NextResponse.json({ error: 'Gagal menyimpan ke Database' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Dokumen ${file.name} berhasil dimuat ke otak AI (${chunks.length} chunk).`,
    });
  } catch (error) {
    console.error('API Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
