create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  study_space_id uuid not null references public.study_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  selected_document_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

drop policy if exists "users manage own notes" on public.notes;
create policy "users manage own notes"
on public.notes for all
to authenticated
using (tenant_id = public.current_tenant_id() and user_id = (select auth.uid()))
with check (tenant_id = public.current_tenant_id() and user_id = (select auth.uid()));

grant select, insert, update, delete on public.notes to authenticated;
grant all on public.notes to service_role;

notify pgrst, 'reload schema';
