alter table public.generated_artifacts
  drop constraint if exists generated_artifacts_kind_check;

alter table public.generated_artifacts
  add constraint generated_artifacts_kind_check
  check (kind in ('summary', 'quiz', 'flashcards', 'apa_summary', 'mind_map', 'data_table', 'study_guide', 'diagram', 'infographic'));

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
