-- Supabase pgvector schema for Janasku RAG Chatbot

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents
create table if not exists documents (
  id bigint primary key generated always as identity,
  content text, -- The actual text chunk of the knowledge base
  metadata jsonb, -- Store filename, page number, etc.
  embedding vector(768) -- We are using gemini-embedding-001 with output dimensionality 768 as recommended
);

-- Create a function to search for documents based on cosine similarity
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
