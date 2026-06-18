-- ============================================================
-- GamesToLearn — Migration initiale
-- Appliquer dans Supabase Studio > SQL Editor
-- ============================================================

-- Extension pour générer des UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE : teachers
-- Liée à auth.users (un enseignant = un compte Supabase Auth)
-- ============================================================
create table public.teachers (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.teachers enable row level security;

-- Un enseignant peut uniquement lire et modifier son propre profil
create policy "teachers: own profile" on public.teachers
  for all using (auth.uid() = id);

-- ============================================================
-- TABLE : classes
-- ============================================================
create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  name       text not null,
  code       text not null unique,
  created_at timestamptz not null default now()
);

alter table public.classes enable row level security;

-- Un enseignant gère uniquement ses propres classes
create policy "classes: own classes" on public.classes
  for all using (auth.uid() = teacher_id);

-- Les élèves peuvent lire une classe via son code (lecture seule)
create policy "classes: student read by code" on public.classes
  for select using (true);

-- ============================================================
-- TABLE : students
-- Pas de compte auth — identifiés par un code unique RGPD-friendly
-- ============================================================
create table public.students (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes(id) on delete cascade,
  first_name text not null,
  code       text not null unique,
  created_at timestamptz not null default now()
);

alter table public.students enable row level security;

-- L'enseignant propriétaire de la classe peut tout faire
create policy "students: teacher manages" on public.students
  for all using (
    exists (
      select 1 from public.classes c
      where c.id = students.class_id
        and c.teacher_id = auth.uid()
    )
  );

-- Lecture publique par code (pour connexion élève)
create policy "students: read by code" on public.students
  for select using (true);

-- ============================================================
-- TABLE : games
-- ============================================================
create table public.games (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  type       text not null,  -- ex: 'click-image', 'match-word'
  config     jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;

-- Jeux en lecture pour tous les authentifiés
create policy "games: read for authenticated" on public.games
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- TABLE : progress
-- ============================================================
create table public.progress (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  game_id    uuid not null references public.games(id) on delete cascade,
  score      integer not null default 0,
  played_at  timestamptz not null default now()
);

alter table public.progress enable row level security;

-- L'enseignant peut lire la progression de ses élèves
create policy "progress: teacher reads" on public.progress
  for select using (
    exists (
      select 1 from public.students s
      join public.classes c on c.id = s.class_id
      where s.id = progress.student_id
        and c.teacher_id = auth.uid()
    )
  );

-- Insertion libre (les élèves ne sont pas authentifiés, utiliser service role pour insérer)
create policy "progress: insert via service role" on public.progress
  for insert with check (true);
