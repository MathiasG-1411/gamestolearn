-- ============================================================
-- GamesToLearn — Plans de travail
-- Appliquer dans Supabase Studio > SQL Editor
-- ============================================================

-- Plans de travail : séquences ordonnées de jeux créées par l'enseignant
create table public.work_plans (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.teachers(id) on delete cascade,
  title       text not null,
  description text,
  game_ids    uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.work_plans enable row level security;

-- L'enseignant gère ses propres plans
create policy "work_plans: teacher manages own" on public.work_plans
  for all using (auth.uid() = teacher_id);

-- Lecture publique pour les élèves (via service role ou anon)
create policy "work_plans: public read" on public.work_plans
  for select using (true);

-- Affectation d'un plan à une classe
create table public.work_plan_classes (
  plan_id   uuid not null references public.work_plans(id) on delete cascade,
  class_id  uuid not null references public.classes(id) on delete cascade,
  primary key (plan_id, class_id)
);

alter table public.work_plan_classes enable row level security;

-- L'enseignant peut gérer les affectations de ses propres plans
create policy "work_plan_classes: teacher manages" on public.work_plan_classes
  for all using (
    exists (
      select 1 from public.work_plans wp
      where wp.id = work_plan_classes.plan_id
        and wp.teacher_id = auth.uid()
    )
  );

-- Lecture publique pour les élèves
create policy "work_plan_classes: public read" on public.work_plan_classes
  for select using (true);
