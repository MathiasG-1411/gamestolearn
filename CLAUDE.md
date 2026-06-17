# GamesToLearn — Plateforme éducative

## Objectif
Application web pour enseignants et élèves : gestion de classes, comptes élèves, jeux pédagogiques et suivi de progression.

## Stack technique
- **Framework** : Next.js 15 (App Router, TypeScript strict)
- **Base de données** : Supabase (PostgreSQL, région Frankfurt EU)
- **Auth** : Supabase Auth (magic link / email+password pour les enseignants)
- **Styles** : Tailwind CSS v3 + shadcn/ui
- **Déploiement** : Vercel (relié au dépôt GitHub)

## RGPD
Pour les élèves, on ne stocke que le **prénom** et un **code généré automatiquement**. Aucune donnée personnelle sensible.

## Arborescence
```
/
├── src/
│   ├── app/                        # App Router Next.js
│   │   ├── (auth)/                 # Groupe : pages d'authentification
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/            # Groupe : espace enseignant (protégé)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Dashboard principal
│   │   │   ├── classes/
│   │   │   │   ├── page.tsx        # Liste des classes
│   │   │   │   └── [id]/page.tsx   # Détail d'une classe
│   │   │   └── games/
│   │   │       └── page.tsx
│   │   ├── student/                # Espace élève (connexion par code)
│   │   │   └── page.tsx
│   │   ├── play/                   # Jeux
│   │   │   └── [gameId]/page.tsx
│   │   ├── layout.tsx              # Layout racine
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Composants shadcn/ui (auto-générés)
│   │   └── ...                     # Composants métier
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Client côté navigateur
│   │   │   └── server.ts           # Client côté serveur (Server Components)
│   │   └── utils.ts
│   └── types/
│       └── database.ts             # Types générés depuis le schéma Supabase
├── supabase/
│   └── migrations/                 # Fichiers SQL de migration
└── .env.local                      # Variables d'environnement (non versionné)
```

## Variables d'environnement requises
À placer dans `.env.local` (local) et dans les settings Vercel (production) :
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Tables Supabase (MVP)
| Table | Colonnes principales |
|---|---|
| `teachers` | id (= auth.uid), email, name |
| `classes` | id, teacher_id, name, code (unique) |
| `students` | id, class_id, first_name, code |
| `games` | id, title, type, config (jsonb) |
| `progress` | id, student_id, game_id, score, played_at |

## Feuille de route MVP
1. [x] Scaffolding (Next.js + Tailwind + shadcn/ui)
2. [ ] Authentification enseignant (Supabase Auth)
3. [ ] Gestion des classes et des élèves
4. [ ] Connexion élève via code de classe
5. [ ] Premier jeu : "clique sur la bonne image"
6. [ ] Déploiement Vercel

## Conventions
- Commits en anglais, messages courts et descriptifs
- Server Components par défaut, `"use client"` uniquement si nécessaire
- Types Supabase dans `src/types/database.ts`
- Migrations SQL dans `supabase/migrations/` (appliquées manuellement dans Supabase Studio)
- Jamais de clé API en dur dans le code
