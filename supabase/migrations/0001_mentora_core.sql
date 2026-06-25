create extension if not exists vector;
create extension if not exists pgcrypto;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  type text not null default 'individual' check (type in ('individual', 'university', 'institute', 'school')),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  learning_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.study_spaces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  study_space_id uuid not null references public.study_spaces(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processing', 'ready', 'failed')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  study_space_id uuid not null references public.study_spaces(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  content text not null,
  embedding vector(1536) not null,
  page_number integer,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  study_space_id uuid not null references public.study_spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.generated_artifacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  study_space_id uuid not null references public.study_spaces(id) on delete cascade,
  kind text not null check (kind in ('quiz', 'flashcards', 'apa_summary')),
  title text not null,
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  task text not null,
  provider text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  status text not null default 'success' check (status in ('success', 'error')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index document_chunks_embedding_idx on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index document_chunks_scope_idx on public.document_chunks (tenant_id, study_space_id);
create index documents_scope_idx on public.documents (tenant_id, user_id, study_space_id);
create index artifacts_scope_idx on public.generated_artifacts (tenant_id, user_id, study_space_id);

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.study_spaces enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.generated_artifacts enable row level security;
alter table public.ai_usage_logs enable row level security;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create policy "tenant members can read tenant"
on public.tenants for select
using (id = public.current_tenant_id());

create policy "users can read their own profile"
on public.profiles for select
using (id = auth.uid());

create policy "users can update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (full_name, learning_profile) on public.profiles to authenticated;

create policy "users manage own study spaces"
on public.study_spaces for all
using (tenant_id = public.current_tenant_id() and user_id = auth.uid())
with check (tenant_id = public.current_tenant_id() and user_id = auth.uid());

create policy "users read own documents"
on public.documents for select
using (tenant_id = public.current_tenant_id() and user_id = auth.uid());

create policy "users read own chunks"
on public.document_chunks for select
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1
    from public.documents d
    where d.id = document_chunks.document_id
      and d.tenant_id = document_chunks.tenant_id
      and d.user_id = auth.uid()
  )
);

create policy "users read own conversations"
on public.conversations for select
using (tenant_id = public.current_tenant_id() and user_id = auth.uid());

create policy "users read own messages"
on public.messages for select
using (tenant_id = public.current_tenant_id() and user_id = auth.uid());

create policy "users read own artifacts"
on public.generated_artifacts for select
using (tenant_id = public.current_tenant_id() and user_id = auth.uid());

create policy "users read own usage"
on public.ai_usage_logs for select
using (tenant_id = public.current_tenant_id() and user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tenant uuid;
  tenant_label text;
begin
  tenant_label := coalesce(new.raw_user_meta_data->>'tenant_name', 'Personal Mentora');

  insert into public.tenants (name, slug, type)
  values (
    tenant_label,
    lower(regexp_replace(tenant_label, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8),
    'individual'
  )
  returning id into tenant;

  insert into public.profiles (id, tenant_id, email, full_name, role, learning_profile)
  values (
    new.id,
    tenant,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'student',
    '{}'::jsonb
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_tenant_id uuid,
  match_study_space_id uuid,
  match_count integer default 8
)
returns table (
  id uuid,
  document_id uuid,
  file_name text,
  content text,
  page_number integer,
  similarity double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    dc.id,
    dc.document_id,
    d.file_name,
    dc.content,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where dc.tenant_id = match_tenant_id
    and dc.study_space_id = match_study_space_id
    and d.tenant_id = dc.tenant_id
    and d.study_space_id = dc.study_space_id
    and d.processing_status = 'ready'
    and (
      coalesce(auth.role(), '') = 'service_role'
      or exists (
        select 1
        from public.study_spaces ss
        where ss.id = match_study_space_id
          and ss.tenant_id = match_tenant_id
          and ss.user_id = auth.uid()
      )
    )
  order by dc.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

revoke execute on function public.match_document_chunks(vector, uuid, uuid, integer) from public, anon;
grant execute on function public.match_document_chunks(vector, uuid, uuid, integer) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy "users read own document objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "users read own stored documents"
on storage.objects for select
using (
  bucket_id = 'documents'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "users insert own stored documents"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.study_spaces ss
    where ss.id::text = (storage.foldername(name))[3]
      and ss.tenant_id = public.current_tenant_id()
      and ss.user_id = auth.uid()
  )
);

create policy "users delete own stored documents"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.study_spaces ss
    where ss.id::text = (storage.foldername(name))[3]
      and ss.tenant_id = public.current_tenant_id()
      and ss.user_id = auth.uid()
  )
);
