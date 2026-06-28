alter table public.generated_artifacts
  drop constraint if exists generated_artifacts_kind_check;

alter table public.generated_artifacts
  add constraint generated_artifacts_kind_check
  check (kind in ('summary', 'quiz', 'flashcards', 'apa_summary', 'mind_map', 'data_table'));
