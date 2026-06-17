# GamesToLearn

Plateforme éducative pour enseignants et élèves : gestion de classes, jeux pédagogiques et suivi de progression.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Auth, région Frankfurt EU)
- **Tailwind CSS v4** + shadcn/ui
- **Vercel** (déploiement)

## Démarrage local

```bash
# 1. Copier les variables d'environnement
cp .env.local.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 2. Installer les dépendances
npm install

# 3. Appliquer la migration SQL dans Supabase Studio
# Fichier : supabase/migrations/001_initial_schema.sql

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (anon) Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (côté serveur uniquement) |

## Documentation

Voir [CLAUDE.md](./CLAUDE.md) pour l'architecture complète, la feuille de route et les conventions.
