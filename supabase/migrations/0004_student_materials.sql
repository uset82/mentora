alter table public.documents
  add column if not exists material_type text not null default 'pdf'
    check (material_type in ('pdf', 'image', 'document', 'link', 'text')),
  add column if not exists mime_type text,
  add column if not exists source_url text;

update public.documents
set material_type = coalesce(material_type, 'pdf'),
    mime_type = coalesce(mime_type, 'application/pdf')
where material_type is null
   or mime_type is null;

alter table public.generated_artifacts
  drop constraint if exists generated_artifacts_kind_check;

alter table public.generated_artifacts
  add constraint generated_artifacts_kind_check
  check (kind in ('summary', 'quiz', 'flashcards', 'apa_summary', 'mind_map'));

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'documents';
