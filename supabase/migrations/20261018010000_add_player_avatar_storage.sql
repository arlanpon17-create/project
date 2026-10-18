insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-avatars',
  'player-avatars',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view player avatars"
  on storage.objects for select
  using (bucket_id = 'player-avatars');

create policy "Users upload their own player avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'player-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete their own player avatars"
  on storage.objects for delete
  using (
    bucket_id = 'player-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
