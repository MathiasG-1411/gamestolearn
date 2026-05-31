# FichesPro — Créateur de fiches enseignant

Application web progressive (PWA) pour créer des fiches d'exercices et de synthèse, optimisée pour les enseignants.

## Fonctionnalités

- **Éditeur par blocs** — exercices numérotés, texte, titres, formules mathématiques, tableaux, colonnes, listes, lignes de réponse, formes géométriques, séparateurs
- **Formules mathématiques** — rendu LaTeX via KaTeX (fractions, racines, puissances, symboles…)
- **Templates prêts à l'emploi** — maths, histoire, grammaire, fiche vierge
- **Export PDF** — impression A4 optimisée
- **Sauvegarde automatique** — les fiches sont conservées dans le navigateur
- **PWA** — installable sur iPhone via Safari → Partager → Sur l'écran d'accueil

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

## Déploiement sur Vercel

### Option 1 — Interface Vercel (recommandé)

1. Aller sur [vercel.com](https://vercel.com) et se connecter avec GitHub
2. Cliquer **"Add New Project"**
3. Importer le repo `gamestolearn`
4. Vercel détecte automatiquement Vite — cliquer **"Deploy"**

### Option 2 — CLI Vercel

```bash
npm i -g vercel
vercel
```

## Stack technique

- [React 18](https://react.dev) + TypeScript
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [KaTeX](https://katex.org) — rendu mathématique
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) — PWA & Service Worker

## Structure

```
src/
├── components/
│   ├── WorksheetEditor.tsx   # Éditeur principal
│   ├── BlockRenderer.tsx     # Rendu de chaque bloc
│   ├── BlockEditor.tsx       # Panneau d'édition d'un bloc
│   ├── WorksheetHeader.tsx   # En-tête de fiche
│   ├── TemplateGallery.tsx   # Galerie d'accueil
│   ├── MathRenderer.tsx      # Rendu KaTeX
│   └── ShapeRenderer.tsx     # Rendu des formes SVG
├── types/worksheet.ts        # Types TypeScript
├── data/templates.ts         # Templates prédéfinis
└── utils/
    ├── storage.ts            # Persistance localStorage
    └── export.ts             # Export PDF
```
