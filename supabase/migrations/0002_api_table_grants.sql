grant usage on schema public to anon, authenticated, service_role;

grant select on public.tenants to anon, authenticated;
grant all on public.tenants to service_role;

grant select on public.profiles to anon, authenticated;
grant update (full_name, learning_profile) on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select, insert, update, delete on public.study_spaces to anon, authenticated;
grant all on public.study_spaces to service_role;

grant select on public.documents to anon, authenticated;
grant all on public.documents to service_role;

grant select on public.document_chunks to anon, authenticated;
grant all on public.document_chunks to service_role;

grant select on public.conversations to anon, authenticated;
grant all on public.conversations to service_role;

grant select on public.messages to anon, authenticated;
grant all on public.messages to service_role;

grant select on public.generated_artifacts to anon, authenticated;
grant all on public.generated_artifacts to service_role;

grant select on public.ai_usage_logs to anon, authenticated;
grant all on public.ai_usage_logs to service_role;

grant select, insert, update, delete on public.document_processing_jobs to anon, authenticated;
grant all on public.document_processing_jobs to service_role;

grant execute on function public.match_document_chunks(vector, uuid, uuid, integer) to authenticated, service_role;

notify pgrst, 'reload schema';
