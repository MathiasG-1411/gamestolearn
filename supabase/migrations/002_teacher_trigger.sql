-- Migration 002 : trigger pour créer le profil enseignant automatiquement
-- À appliquer dans Supabase Studio > SQL Editor

-- Fonction appelée à chaque nouvel utilisateur Supabase Auth
create or replace function public.handle_new_teacher()
returns trigger as $$
begin
  insert into public.teachers (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger sur auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_teacher();

-- Rétrocompatibilité : crée les profils des utilisateurs déjà existants
insert into public.teachers (id, email, name)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;
