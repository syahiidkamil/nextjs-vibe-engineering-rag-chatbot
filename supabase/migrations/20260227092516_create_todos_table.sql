create table todos (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table todos enable row level security;

create policy "Allow all operations on todos"
  on todos for all using (true) with check (true);
