-- Conversations table
create table conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Percakapan Baru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table conversations enable row level security;

create policy "Allow all operations on conversations"
  on conversations for all using (true) with check (true);

create index conversations_updated_at_idx on conversations (updated_at desc);

-- Messages table
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  sources jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Allow all operations on messages"
  on messages for all using (true) with check (true);

create index messages_conversation_created_idx on messages (conversation_id, created_at asc);
