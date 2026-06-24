-- Actually create the avatars storage bucket (migration 002 only documented intent)
-- and apply the RLS policies it described, on storage.objects.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(split_part(name, '/', 2), '.', 1) = auth.uid()::text
);

create policy "Authenticated users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(split_part(name, '/', 2), '.', 1) = auth.uid()::text
);

create policy "Anyone can view avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

create policy "Admins can delete avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
