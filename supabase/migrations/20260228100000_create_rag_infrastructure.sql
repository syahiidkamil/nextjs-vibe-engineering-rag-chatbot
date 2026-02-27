-- 1. Enable pgvector extension
create extension if not exists vector with schema extensions;

-- 2. Documents table (uploaded file metadata)
create table documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_size integer not null,
  file_path text not null,
  mime_type text not null,
  status text not null default 'uploading'
    check (status in ('uploading', 'processing', 'ready', 'error')),
  error_message text,
  chunk_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;
create policy "Allow all operations on documents"
  on documents for all using (true) with check (true);

-- 3. Document chunks table (text chunks + vector embeddings)
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  embedding extensions.vector(768),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table document_chunks enable row level security;
create policy "Allow all operations on document_chunks"
  on document_chunks for all using (true) with check (true);

-- Index for vector search (cosine distance)
create index on document_chunks
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

-- 4. Similarity search function (RPC)
create or replace function match_documents(
  query_embedding extensions.vector(768),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  metadata jsonb,
  similarity float,
  filename text
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.filename
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where d.status = 'ready'
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 5. Storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Policies: allow all operations on documents bucket (MVP without auth)
create policy "Allow all uploads to documents bucket"
  on storage.objects for insert
  with check (bucket_id = 'documents');

create policy "Allow all reads from documents bucket"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Allow all deletes from documents bucket"
  on storage.objects for delete
  using (bucket_id = 'documents');
