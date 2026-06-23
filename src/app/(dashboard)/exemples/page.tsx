"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";

const EXAMPLES = [
  {
    type: "hub",
    label: "Hub interactif",
    icon: "🗺️",
    description: "Carte centrale avec zones — QCM, saisie libre, ordre, classement",
    color: "#0891B2",
    json: {
      title: "Le Tour du Moyen Âge",
      theme: "chateau",
      intro: "Explore chaque zone du château et relève les défis pour percer les secrets du Moyen Âge !",
      mapEmoji: "🏰",
      zones: [
        {
          id: "z1",
          label: "La Grande Salle",
          emoji: "👑",
          description: "Le banquet du seigneur",
          challenge: {
            type: "qcm",
            question: "Qui dirigeait un fief au Moyen Âge ?",
            choices: ["Le marchand", "Le seigneur", "Le moine", "Le paysan"],
            correctIndex: 1,
            explanation: "Le seigneur possédait le fief et accordait sa protection aux paysans qui travaillaient ses terres.",
          },
        },
        {
          id: "z2",
          label: "La Bibliothèque",
          emoji: "📜",
          description: "Les manuscrits des moines",
          challenge: {
            type: "texte",
            question: "Comment appelait-on les livres écrits à la main par les moines ?",
            answer: "manuscrits",
            placeholder: "Tape ta réponse…",
            explanation: "Les manuscrits (du latin 'manu scriptus', écrit à la main) étaient copiés patiemment par les moines copistes.",
            tolerance: true,
          },
        },
        {
          id: "z3",
          label: "L'Écurie",
          emoji: "⚔️",
          description: "La formation des chevaliers",
          challenge: {
            type: "ordre",
            question: "Remets les étapes de la formation d'un chevalier dans l'ordre !",
            items: ["Page (7 ans)", "Écuyer (14 ans)", "Chevalier (21 ans)"],
            explanation: "On devenait d'abord page, puis écuyer au service d'un chevalier, avant d'être adoubé chevalier lors d'une cérémonie.",
          },
        },
        {
          id: "z4",
          label: "Le Marché",
          emoji: "🏪",
          description: "Les métiers de la ville",
          challenge: {
            type: "tri",
            question: "Classe ces personnages selon leur rôle au Moyen Âge.",
            categories: ["Clergé", "Noblesse", "Tiers état"],
            items: [
              { label: "Évêque", categoryIndex: 0 },
              { label: "Moine", categoryIndex: 0 },
              { label: "Chevalier", categoryIndex: 1 },
              { label: "Baron", categoryIndex: 1 },
              { label: "Paysan", categoryIndex: 2 },
              { label: "Artisan", categoryIndex: 2 },
            ],
            explanation: "La société médiévale était divisée en trois ordres : ceux qui prient (clergé), ceux qui combattent (noblesse) et ceux qui travaillent (tiers état).",
          },
        },
      ],
      ending: {
        text: "Bravo ! Tu as exploré tout le château et maîtrises les bases de la société médiévale.",
        emoji: "🏆",
      },
    },
  },
  // ── P4 · Période 1 — Numération ─────────────────────────────────────
  {
    type: "hub",
    label: "Hub — Numération P4",
    icon: "🚀",
    description: "P4 · Période 1 — Numération jusqu'à 100 000",
    color: "#0891B2",
    json: {
      title: "Mission 100 000",
      theme: "espace",
      intro: "Centre de contrôle à toi ! Explore les 5 stations de la navette et prouve que tu maîtrises la numération jusqu'à 100 000.",
      mapEmoji: "🚀",
      zones: [
        {
          id: "z1",
          label: "Poste de lecture",
          emoji: "🌟",
          description: "Lire les grands nombres",
          challenge: {
            type: "qcm",
            question: "Quel nombre correspond à « soixante-quatorze mille deux cent soixante » ?",
            choices: ["74 206", "74 620", "70 426", "74 260"],
            correctIndex: 3,
            explanation: "Soixante-quatorze mille = 74 000, deux cent soixante = 260 → 74 260. Attention à ne pas confondre les rangs !",
          },
        },
        {
          id: "z2",
          label: "Salle d'encodage",
          emoji: "✍️",
          description: "Écrire les grands nombres en chiffres",
          challenge: {
            type: "texte",
            question: "Écris en chiffres (sans espace) : « trente et un mille cinq cent huit »",
            answer: "31508",
            placeholder: "ex : 12345",
            tolerance: true,
            explanation: "Trente et un mille (31 000) + cinq cent huit (508) = 31 508. Colle les chiffres : 31508",
          },
        },
        {
          id: "z3",
          label: "Radar d'ordre",
          emoji: "📡",
          description: "Ordonner les grands nombres",
          challenge: {
            type: "ordre",
            question: "Range ces nombres du plus petit au plus grand.",
            items: ["9 999", "23 045", "23 450", "23 504", "100 000"],
            explanation: "9 999 < 23 045 < 23 450 < 23 504 < 100 000. Un nombre à 5 chiffres est toujours plus grand qu'un nombre à 4 chiffres.",
          },
        },
        {
          id: "z4",
          label: "Station des rangs",
          emoji: "🔢",
          description: "Identifier les rangs",
          challenge: {
            type: "tri",
            question: "Place chaque chiffre du nombre 85 632 dans son rang.",
            categories: ["Dizaines de milliers", "Milliers", "Centaines", "Dizaines", "Unités"],
            items: [
              { label: "8", categoryIndex: 0 },
              { label: "5", categoryIndex: 1 },
              { label: "6", categoryIndex: 2 },
              { label: "3", categoryIndex: 3 },
              { label: "2", categoryIndex: 4 },
            ],
            explanation: "85 632 : 8 = dizaines de milliers, 5 = milliers, 6 = centaines, 3 = dizaines, 2 = unités.",
          },
        },
        {
          id: "z5",
          label: "Centre de décomposition",
          emoji: "🧩",
          description: "Décomposer un nombre",
          challenge: {
            type: "qcm",
            question: "Quel nombre est égal à 6×10 000 + 3×1 000 + 7×100 + 4×10 + 9 ?",
            choices: ["63 479", "60 479", "63 409", "63 749"],
            correctIndex: 3,
            explanation: "60 000 + 3 000 + 700 + 40 + 9 = 63 749. Chaque terme correspond à un rang précis du nombre.",
          },
        },
      ],
      ending: {
        text: "Bravo pilote ! Tu maîtrises la numération jusqu'à 100 000. Note tes erreurs sur ta feuille !",
        emoji: "🚀",
      },
    },
  },
  // ── P4 · Période 1 — Additions & Soustractions ───────────────────────
  {
    type: "quete",
    label: "Quête — Additions P4",
    icon: "🧮",
    description: "P4 · Période 1 — Additions et soustractions à retenue",
    color: "#9333EA",
    json: {
      title: "L'Atelier du Maître Calcul",
      theme: "chateau",
      heroEmoji: "🧮",
      intro: "Le Maître Calcul t'attend dans son atelier secret. Pour franchir chaque porte, tu devras maîtriser les additions et soustractions à grand nombre. En route !",
      rooms: [
        {
          id: "r1",
          name: "L'Antichambre",
          emoji: "🚪",
          narrative: "Le Maître te tend les premières feuilles : additions et soustractions sans retenue. Concentre-toi bien !",
          challenges: [
            {
              id: "r1c1",
              competence: "Addition sans retenue",
              question: "Calcule : 3 425 + 2 341 = ?",
              choices: ["5 856", "5 776", "5 766", "5 667"],
              correctIndex: 2,
              explanation: "3 425 + 2 341 : 5+1=6, 2+4=6, 4+3=7, 3+2=5 → 5 766",
              remediation: {
                hint: "Additionne colonne par colonne de droite à gauche : unités, dizaines, centaines, milliers.",
                question: "Calcule : 2 314 + 1 253 = ?",
                choices: ["3 567", "3 557", "3 467", "3 677"],
                correctIndex: 0,
                explanation: "2 314 + 1 253 : 4+3=7, 1+5=6, 3+2=5, 2+1=3 → 3 567",
              },
              reward: { item: "Feuille de calcul", emoji: "📄" },
            },
            {
              id: "r1c2",
              competence: "Soustraction sans retenue",
              question: "Calcule : 6 897 − 3 452 = ?",
              choices: ["3 345", "3 445", "3 455", "3 545"],
              correctIndex: 1,
              explanation: "6 897 − 3 452 : 7−2=5, 9−5=4, 8−4=4, 6−3=3 → 3 445",
              remediation: {
                hint: "Soustrais colonne par colonne de droite à gauche.",
                question: "Calcule : 4 786 − 2 341 = ?",
                choices: ["2 445", "2 345", "2 435", "2 545"],
                correctIndex: 0,
                explanation: "4 786 − 2 341 : 6−1=5, 8−4=4, 7−3=4, 4−2=2 → 2 445",
              },
              reward: { item: "Règle de calcul", emoji: "📏" },
            },
          ],
          exit: {
            lockedText: "La porte résiste… résous les calculs pour l'ouvrir.",
            unlockText: "La porte s'ouvre ! Tu passes à la forge des retenues.",
          },
        },
        {
          id: "r2",
          name: "La Forge des Retenues",
          emoji: "⚒️",
          narrative: "Ici les calculs ont des retenues ! Le chiffre retenu passe à la colonne suivante. Reste attentif !",
          challenges: [
            {
              id: "r2c1",
              competence: "Addition avec retenue",
              question: "Calcule : 4 537 + 2 286 = ?",
              choices: ["6 813", "6 923", "6 823", "6 723"],
              correctIndex: 2,
              explanation: "4 537 + 2 286 : 7+6=13 (écris 3, retiens 1), 3+8+1=12 (écris 2, retiens 1), 5+2+1=8, 4+2=6 → 6 823",
              remediation: {
                hint: "Quand la somme dépasse 9, écris le chiffre des unités et retiens 1 pour la colonne suivante.",
                question: "Calcule : 3 256 + 1 847 = ?",
                choices: ["5 013", "5 103", "5 203", "5 113"],
                correctIndex: 1,
                explanation: "3 256 + 1 847 : 6+7=13, 5+4+1=10, 2+8+1=11, 3+1+1=5 → 5 103",
              },
              reward: { item: "Marteau de forge", emoji: "🔨" },
            },
            {
              id: "r2c2",
              competence: "Soustraction avec emprunt",
              question: "Calcule : 7 342 − 2 185 = ?",
              choices: ["5 267", "5 157", "5 257", "5 057"],
              correctIndex: 1,
              explanation: "7 342 − 2 185 : 2−5 impossible → emprunte ; 12−5=7 ; 4−1−8 → emprunte ; 13−8=5 → 5 157",
              remediation: {
                hint: "Quand le chiffre du haut est plus petit, emprunte 10 à la colonne de gauche.",
                question: "Calcule : 5 624 − 1 358 = ?",
                choices: ["4 166", "4 366", "4 266", "4 256"],
                correctIndex: 2,
                explanation: "5 624 − 1 358 : 4−8 → 14−8=6 ; 2−1−5 → 11−5=6 ; 6−1−3=2 ; 5−1=4 → 4 266",
              },
              reward: { item: "Enclume", emoji: "⚒️" },
            },
          ],
          exit: {
            lockedText: "Les retenues te bloquent encore…",
            unlockText: "La forge est maîtrisée ! Tu avances vers la chambre du Maître.",
          },
        },
        {
          id: "r3",
          name: "La Chambre du Maître",
          emoji: "🎓",
          narrative: "L'épreuve finale ! Deux problèmes tirés de la vie réelle. Lis attentivement avant de calculer !",
          challenges: [
            {
              id: "r3c1",
              competence: "Problème — addition",
              question: "Dans une bibliothèque : 2 457 livres au rez-de-chaussée et 1 386 livres à l'étage. Combien de livres en tout ?",
              choices: ["3 743", "3 843", "3 853", "3 943"],
              correctIndex: 1,
              explanation: "2 457 + 1 386 : 7+6=13, 5+8+1=14, 4+3+1=8, 2+1=3 → 3 843 livres",
              remediation: {
                hint: "Le mot « en tout » indique une addition. Additionne les deux quantités.",
                question: "Un commerçant a 1 234 pommes et en reçoit 765 de plus. Combien en a-t-il ?",
                choices: ["1 899", "1 979", "1 999", "2 000"],
                correctIndex: 2,
                explanation: "1 234 + 765 : 4+5=9, 3+6=9, 2+7=9, 1+0=1 → 1 999 pommes",
              },
              reward: { item: "Parchemin du Maître", emoji: "📜" },
            },
            {
              id: "r3c2",
              competence: "Problème — soustraction",
              question: "Une ville comptait 5 204 habitants. Après des déménagements, il en reste 2 837. Combien sont partis ?",
              choices: ["2 367", "2 467", "2 267", "3 367"],
              correctIndex: 0,
              explanation: "5 204 − 2 837 = 2 367. Vérifie : 2 367 + 2 837 = 5 204 ✓",
              remediation: {
                hint: "Le mot « partis » indique une soustraction. Soustrais ce qui reste du total.",
                question: "Un magasin avait 3 042 articles et en a vendu 1 568. Combien en reste-t-il ?",
                choices: ["1 374", "1 474", "1 574", "1 404"],
                correctIndex: 1,
                explanation: "3 042 − 1 568 = 1 474. Vérifie : 1 474 + 1 568 = 3 042 ✓",
              },
              reward: { item: "Médaille d'or", emoji: "🥇" },
            },
          ],
          exit: {
            lockedText: "La dernière épreuve t'attend…",
            unlockText: "Le Maître Calcul est impressionné ! Tu mérites la médaille !",
          },
        },
      ],
      ending: {
        text: "Félicitations ! Tu maîtrises les additions et soustractions à grand nombre. Note tes erreurs sur ta feuille pour t'entraîner.",
        emoji: "🎓",
      },
    },
  },
  // ── P4 · Période 1 — Tables de multiplication ────────────────────────
  {
    type: "defi",
    label: "Défi — Tables P4",
    icon: "⚡",
    description: "P4 · Période 1 — Tables ×2 à ×10 (25 questions, formats variés)",
    color: "#EA580C",
    json: {
      title: "Tables ×2 à ×10",
      emoji: "⚡",
      narrative: "Le défi des tables commence ! Réponds le plus vite possible. Chaque bonne réponse rapide te rapporte des points bonus. Les formats changent : multiplication, division, facteur manquant, problème !",
      totalTimeSeconds: 150,
      challenges: [
        { question: "7 × 8 = ?", choices: ["56", "48", "54", "63"], correctIndex: 0, points: 10 },
        { question: "9 × 6 = ?", choices: ["48", "54", "63", "72"], correctIndex: 1, points: 10 },
        { question: "6 × 7 = ?", choices: ["40", "48", "42", "35"], correctIndex: 2, points: 10 },
        { question: "8 × 3 = ?", choices: ["21", "24", "27", "32"], correctIndex: 1, points: 10 },
        { question: "5 × 9 = ?", choices: ["40", "45", "50", "54"], correctIndex: 1, points: 10 },
        { question: "4 × 8 = ?", choices: ["32", "24", "28", "36"], correctIndex: 0, points: 10 },
        { question: "7 × ? = 63", choices: ["7", "8", "9", "10"], correctIndex: 2, points: 10 },
        { question: "? × 6 = 48", choices: ["6", "7", "9", "8"], correctIndex: 3, points: 10 },
        { question: "56 ÷ 7 = ?", choices: ["6", "8", "7", "9"], correctIndex: 1, points: 10 },
        { question: "81 ÷ 9 = ?", choices: ["9", "7", "8", "10"], correctIndex: 0, points: 10, timeBonusSeconds: 5 },
        { question: "3 × 9 = ?", choices: ["21", "27", "24", "30"], correctIndex: 1, points: 10 },
        { question: "6 × 8 = ?", choices: ["42", "54", "48", "46"], correctIndex: 2, points: 10 },
        { question: "9 × 4 = ?", choices: ["27", "32", "40", "36"], correctIndex: 3, points: 10 },
        { question: "8 × 5 = ?", choices: ["35", "40", "45", "50"], correctIndex: 1, points: 10 },
        { question: "? × 7 = 49", choices: ["5", "6", "7", "8"], correctIndex: 2, points: 10 },
        { question: "72 ÷ 8 = ?", choices: ["9", "7", "8", "10"], correctIndex: 0, points: 10, timeBonusSeconds: 5 },
        { question: "9 × ? = 45", choices: ["4", "5", "6", "7"], correctIndex: 1, points: 10 },
        { question: "8 × 7 = ?", choices: ["48", "54", "56", "63"], correctIndex: 2, points: 15 },
        { question: "6 boîtes de 9 crayons, c'est combien ?", choices: ["54", "48", "57", "60"], correctIndex: 0, points: 10 },
        { question: "5 × 6 = ?", choices: ["25", "28", "35", "30"], correctIndex: 3, points: 10 },
        { question: "42 ÷ 6 = ?", choices: ["5", "6", "8", "7"], correctIndex: 3, points: 10 },
        { question: "9 × 9 = ?", choices: ["81", "72", "80", "90"], correctIndex: 0, points: 15, timeBonusSeconds: 8 },
        { question: "? × 8 = 64", choices: ["6", "7", "8", "9"], correctIndex: 2, points: 10 },
        { question: "4 rangées de 7 élèves, c'est combien ?", choices: ["21", "24", "35", "28"], correctIndex: 3, points: 10 },
        { question: "7 × 6 + 7 × 3 = ?", choices: ["56", "60", "70", "63"], correctIndex: 3, points: 20, timeBonusSeconds: 10 },
      ],
    },
  },
  {
    type: "aventure",
    label: "Aventure",
    icon: "📖",
    description: "Livre dont tu es le héros — narration + choix",
    color: "#7C3AED",
    json: {
      title: "L'Expédition en Égypte Ancienne",
      theme: "chateau",
      intro:
        "Tu es un jeune archéologue en mission secrète. Le sable chaud crisse sous tes bottes alors que tu approches des grandes pyramides de Gizeh…",
      character: "Archéologue",
      characterEmoji: "🗺️",
      startChapterId: "ch1",
      chapters: [
        {
          id: "ch1",
          narrative:
            "Devant toi se dresse le grand Sphinx. Un gardien surgit : « Pour entrer, tu dois répondre à mon énigme ! »",
          challenge: {
            question: "Quel pharaon a fait construire la Grande Pyramide de Gizeh ?",
            choices: ["Khéops", "Toutânkhamon", "Ramsès II"],
            correctIndex: 0,
            correctFeedback: "« Bien parlé, jeune explorateur ! » Le gardien s'écarte.",
            wrongFeedback: "Le gardien fronce les sourcils… Réfléchis encore !",
          },
          correctNext: "ch2",
          wrongNext: "ch1",
        },
        {
          id: "ch2",
          narrative:
            "Tu entres dans un couloir sombre. Des hiéroglyphes brillent à la lueur de ta torche. Une question est gravée dans la pierre…",
          challenge: {
            question: "Le Nil coule dans quel sens ?",
            choices: ["D'est en ouest", "Du nord au sud", "Du sud au nord"],
            correctIndex: 2,
            correctFeedback: "Une porte secrète s'ouvre ! Tu avances dans le couloir.",
            wrongFeedback: "Une décharge te pique les doigts. Essaie encore !",
          },
          correctNext: "ch3",
          wrongNext: "ch2",
        },
        {
          id: "ch3",
          narrative:
            "Tu arrives dans la chambre du pharaon. Une voix mystérieuse résonne : « Prouve que tu mérites ce trésor… »",
          challenge: {
            question: "Combien font 47 + 36 ?",
            choices: ["83", "73", "93"],
            correctIndex: 0,
            correctFeedback: "Le coffre s'ouvre ! Tu t'échappes avec le trésor !",
            wrongFeedback: "Le calcul est incorrect… Compte encore une fois.",
          },
          correctNext: "end_good",
          wrongNext: "ch3",
        },
      ],
      endingGood: {
        text: "Félicitations ! Tu as résolu toutes les énigmes et ramené le trésor. Tu es un vrai archéologue !",
        emoji: "🏆",
        xp: 100,
      },
      endingBad: {
        text: "L'aventure s'arrête ici. Entraîne-toi et reviens relever le défi !",
        emoji: "😔",
        xp: 20,
      },
    },
  },
  {
    type: "mission",
    label: "Mission",
    icon: "🎯",
    description: "Mission multi-phases avec boss final",
    color: "#DC2626",
    json: {
      title: "Mission Système Solaire",
      narrative:
        "Agent spécial, nous avons besoin de toi. Une sonde mystérieuse traverse notre système solaire et nous devons l'identifier. Prépare-toi !",
      phases: [
        {
          title: "Phase 1 — Identification des planètes",
          briefing:
            "Pour localiser la sonde, tu dois d'abord connaître les planètes par cœur.",
          questions: [
            {
              question: "Quelle est la planète la plus proche du Soleil ?",
              choices: ["Vénus", "Mercure", "Mars"],
              correctIndex: 1,
              feedback: "Exact ! Mercure orbite en seulement 88 jours autour du Soleil.",
            },
            {
              question: "Quelle planète est surnommée la 'planète rouge' ?",
              choices: ["Saturne", "Jupiter", "Mars"],
              correctIndex: 2,
              feedback:
                "Bravo ! Mars doit sa couleur rougeâtre à l'oxyde de fer sur sa surface.",
            },
            {
              question: "Quelle est la plus grande planète du système solaire ?",
              choices: ["Jupiter", "Saturne", "Uranus"],
              correctIndex: 0,
              feedback: "Jupiter est si grande qu'on pourrait y mettre 1 300 Terres !",
            },
          ],
        },
        {
          title: "Phase 2 — Analyse de la trajectoire",
          briefing: "Bonne phase 1 ! Maintenant, analyse les données de trajectoire.",
          questions: [
            {
              question: "La Terre met combien de temps à faire le tour du Soleil ?",
              choices: ["24 heures", "365 jours", "28 jours"],
              correctIndex: 1,
              feedback: "Parfait ! C'est ce qu'on appelle une révolution ou une 'année'.",
            },
            {
              question: "Quelle planète possède les anneaux les plus visibles ?",
              choices: ["Jupiter", "Uranus", "Saturne"],
              correctIndex: 2,
              feedback: "Les anneaux de Saturne sont composés de glace et de roches !",
            },
          ],
        },
      ],
      bossChallenge: {
        question:
          "La sonde a été localisée ! Combien de planètes compte officiellement notre système solaire depuis 2006 ?",
        choices: ["8", "9", "10"],
        correctIndex: 0,
        rewardText:
          "Mission accomplie ! Pluton a été reclassée en 'planète naine' en 2006. Tu es un vrai expert de l'espace !",
      },
    },
  },
  {
    type: "defi",
    label: "Défi chronométré",
    icon: "⚡",
    description: "Course contre la montre — réponds vite !",
    color: "#F97316",
    json: {
      title: "Tables de Multiplication Express",
      emoji: "⚡",
      narrative:
        "Le chronomètre tourne ! Réponds le plus vite possible aux calculs. Chaque bonne réponse rapide rapporte des points bonus !",
      totalTimeSeconds: 120,
      challenges: [
        {
          question: "Combien font 6 × 7 ?",
          choices: ["36", "42", "48", "54"],
          correctIndex: 1,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 8 × 9 ?",
          choices: ["63", "64", "72", "81"],
          correctIndex: 2,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 7 × 7 ?",
          choices: ["42", "48", "49", "56"],
          correctIndex: 2,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 9 × 6 ?",
          choices: ["48", "54", "56", "63"],
          correctIndex: 1,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 8 × 6 ?",
          choices: ["42", "46", "48", "52"],
          correctIndex: 2,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 9 × 8 ?",
          choices: ["64", "72", "76", "81"],
          correctIndex: 1,
          points: 15,
          timeBonusSeconds: 8,
        },
        {
          question: "Combien font 7 × 9 ?",
          choices: ["56", "61", "63", "72"],
          correctIndex: 2,
          points: 15,
          timeBonusSeconds: 8,
        },
        {
          question: "Combien font 9 × 9 ?",
          choices: ["72", "81", "84", "90"],
          correctIndex: 1,
          points: 20,
          timeBonusSeconds: 10,
        },
      ],
    },
  },
  {
    type: "plateau",
    label: "Jeu de plateau",
    icon: "🎲",
    description: "Avance sur le plateau en répondant correctement",
    color: "#059669",
    json: {
      title: "Tour de France",
      theme: "france",
      narrative:
        "Bienvenue dans le Tour de France géographique ! Parcours l'Hexagone en répondant aux questions sur les villes, fleuves et régions de France.",
      characterEmoji: "🚴",
      spaces: [
        {
          position: 1,
          type: "question",
          question: "Quelle est la capitale de la France ?",
          choices: ["Marseille", "Lyon", "Paris"],
          correctIndex: 2,
          correctFeedback: "Bravo ! Paris est la capitale et la plus grande ville de France.",
          wrongFeedback: "C'est Paris ! Ne confonds pas avec les autres grandes villes.",
        },
        {
          position: 2,
          type: "bonus",
          bonusSpaces: 2,
          narrative: "Coup de vent favorable ! Tu avances de 2 cases supplémentaires !",
        },
        {
          position: 3,
          type: "question",
          question: "Quel est le plus long fleuve de France ?",
          choices: ["La Seine", "Le Rhône", "La Loire"],
          correctIndex: 2,
          correctFeedback:
            "La Loire fait 1 006 km ! C'est le dernier grand fleuve sauvage d'Europe.",
          wrongFeedback:
            "C'est la Loire, pas la Seine ! La Loire traverse notamment Nantes et Tours.",
        },
        {
          position: 4,
          type: "repos",
          narrative:
            "Pause pique-nique dans un champ de lavande en Provence. Tu reprends des forces !",
        },
        {
          position: 5,
          type: "question",
          question: "Quelle montagne est la plus haute de France ?",
          choices: ["Le Mont Blanc", "Le Puy de Dôme", "Le Mont Ventoux"],
          correctIndex: 0,
          correctFeedback:
            "Le Mont Blanc culmine à 4 808 m ! C'est aussi le toit de l'Europe occidentale.",
          wrongFeedback: "C'est le Mont Blanc, dans les Alpes, avec 4 808 m d'altitude !",
        },
        {
          position: 6,
          type: "bonus",
          bonusSpaces: 3,
          narrative: "Descente à toute vitesse dans les Pyrénées ! Tu gagnes 3 cases !",
        },
        {
          position: 7,
          type: "question",
          question: "Quelle mer borde la côte sud-est de la France ?",
          choices: ["La Manche", "L'Atlantique", "La Méditerranée"],
          correctIndex: 2,
          correctFeedback: "La Méditerranée borde la Côte d'Azur, de Marseille à Nice !",
          wrongFeedback:
            "C'est la mer Méditerranée ! L'Atlantique est à l'ouest et la Manche au nord.",
        },
      ],
      endNarrative:
        "Félicitations ! Tu as traversé toute la France. Champion du Tour de France géographique !",
    },
  },
  {
    type: "cartes",
    label: "Jeu de cartes",
    icon: "🃏",
    description: "Duel RPG — active tes cartes en répondant",
    color: "#2563EB",
    json: {
      title: "Duel des Fractions",
      narrative:
        "Le sorcier Calculix a jeté un sort sur la bibliothèque ! Pour le vaincre, utilise tes cartes de mathématiques.",
      setting: "bibliotheque",
      playerName: "Élève Courageux",
      playerEmoji: "🧙",
      enemyName: "Calculix",
      enemyEmoji: "👹",
      playerMaxHP: 100,
      enemyMaxHP: 100,
      cards: [
        {
          id: "c1",
          name: "Flèche de la moitié",
          emoji: "🏹",
          type: "attack",
          question: "Quelle est la moitié de 48 ?",
          choices: ["24", "26", "22"],
          correctIndex: 0,
          power: 20,
          description: "Une flèche précise qui inflige 20 points de dégâts.",
          wrongPenalty: 10,
        },
        {
          id: "c2",
          name: "Bouclier du quart",
          emoji: "🛡️",
          type: "defense",
          question: "1/4 de 100, c'est combien ?",
          choices: ["40", "20", "25"],
          correctIndex: 2,
          power: 25,
          description: "Un bouclier solide qui absorbe 25 points de dégâts.",
          wrongPenalty: 0,
        },
        {
          id: "c3",
          name: "Boule de feu des tiers",
          emoji: "🔥",
          type: "attack",
          question: "Quel est le tiers (1/3) de 60 ?",
          choices: ["20", "30", "15"],
          correctIndex: 0,
          power: 30,
          description: "Une boule de feu puissante qui inflige 30 dégâts !",
          wrongPenalty: 15,
        },
        {
          id: "c4",
          name: "Potion de guérison",
          emoji: "🧪",
          type: "heal",
          question: "3/4 de 80, c'est combien ?",
          choices: ["64", "40", "60"],
          correctIndex: 2,
          power: 25,
          description: "Récupère 25 points de vie si tu réponds correctement.",
          wrongPenalty: 5,
        },
        {
          id: "c5",
          name: "Éclair du double",
          emoji: "⚡",
          type: "attack",
          question: "1/2 de 36, plus 1/3 de 12, ça fait combien ?",
          choices: ["22", "24", "18"],
          correctIndex: 0,
          power: 40,
          description: "L'attaque ultime ! 40 dégâts si tu maîtrises les fractions.",
          wrongPenalty: 20,
        },
      ],
    },
  },
  {
    type: "construction",
    label: "Construction",
    icon: "🔧",
    description: "Débloque des pièces pour construire quelque chose",
    color: "#0891B2",
    json: {
      title: "Construis le Système Solaire",
      narrative:
        "La salle des sciences a besoin de toi ! Réponds aux questions pour débloquer chaque pièce de notre maquette du système solaire.",
      buildTarget: "Maquette du Système Solaire",
      buildEmoji: "🌌",
      pieces: [
        {
          id: "p1",
          name: "Le Soleil",
          emoji: "☀️",
          question: "Le Soleil est une étoile. De quoi est-il principalement composé ?",
          choices: ["Hydrogène et hélium", "Lave volcanique", "Fer fondu"],
          correctIndex: 0,
          hint: "C'est le même gaz que dans les ballons de fête, en beaucoup plus lourd !",
          unlockText:
            "Le Soleil est placé au centre ! Il représente 99,8 % de la masse du système solaire.",
        },
        {
          id: "p2",
          name: "Mercure",
          emoji: "⚫",
          question:
            "Mercure est la planète la plus proche du Soleil. Quel est son temps de révolution ?",
          choices: ["365 jours", "24 heures", "88 jours"],
          correctIndex: 2,
          hint: "Elle tourne beaucoup plus vite que la Terre autour du Soleil.",
          unlockText:
            "Mercure est ajoutée ! C'est aussi la plus petite planète du système solaire.",
        },
        {
          id: "p3",
          name: "La Terre",
          emoji: "🌍",
          question: "Quelle est la seule planète connue à abriter de la vie ?",
          choices: ["La Terre", "Mars", "Vénus"],
          correctIndex: 0,
          hint: "C'est notre planète ! Elle possède de l'eau liquide et une atmosphère idéale.",
          unlockText:
            "La Terre est installée à la 3e position ! Elle est à 150 millions de km du Soleil.",
        },
        {
          id: "p4",
          name: "Jupiter",
          emoji: "🟠",
          question:
            "Jupiter possède une célèbre tempête géante. Comment s'appelle-t-elle ?",
          choices: ["L'Ouragan Solaire", "La Tache Noire", "La Grande Tache Rouge"],
          correctIndex: 2,
          hint: "C'est une tempête qui dure depuis plus de 400 ans !",
          unlockText:
            "Jupiter rejoint la maquette ! Cette planète géante aurait pu devenir une étoile.",
        },
        {
          id: "p5",
          name: "Saturne",
          emoji: "🪐",
          question: "Saturne est célèbre pour ses anneaux. De quoi sont-ils composés ?",
          choices: ["Glace et roches", "Or et argent", "Gaz chauds"],
          correctIndex: 0,
          hint: "Ils brillent parce qu'ils reflètent la lumière du Soleil.",
          unlockText:
            "Saturne et ses magnifiques anneaux sont ajoutés ! Ils s'étendent sur 282 000 km.",
        },
        {
          id: "p6",
          name: "Neptune",
          emoji: "💙",
          question:
            "Neptune est la planète la plus éloignée du Soleil. Combien de temps lui faut-il pour en faire le tour ?",
          choices: ["12 ans", "84 ans", "165 ans"],
          correctIndex: 2,
          hint: "Depuis sa découverte en 1846, elle n'a fait qu'une seule révolution complète !",
          unlockText:
            "Neptune complète la maquette ! Le système solaire est terminé. Félicitations !",
        },
      ],
      completionText:
        "Extraordinaire ! Tu as construit tout le système solaire. La maquette est prête pour la salle des sciences !",
    },
  },
];

export default function ExemplesPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (label: string, json: object) => {
    await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Exemples de jeux</h1>
      <p className="text-[#475569] text-sm mb-8">
        Copie un exemple, puis colle-le dans{" "}
        <Link href="/games/new" className="text-[#2563EB] font-medium hover:underline">
          Créer un jeu
        </Link>{" "}
        après avoir sélectionné le bon type. Tu peux le modifier à ta guise !
      </p>

      <div className="flex flex-col gap-6">
        {EXAMPLES.map((ex) => {
          const isCopied = copied === ex.label;
          return (
            <div
              key={ex.label}
              className="bg-white rounded-[20px] overflow-hidden"
              style={{
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{
                  background: `linear-gradient(135deg, ${ex.color}15 0%, ${ex.color}08 100%)`,
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ex.icon}</span>
                  <div>
                    <p className="font-bold text-[#0F172A] text-[15px]">{ex.label}</p>
                    <p className="text-xs text-[#64748B]">{ex.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/games/new"
                    className="text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
                    style={{ color: ex.color, background: `${ex.color}15` }}
                  >
                    Créer ce jeu →
                  </Link>
                  <button
                    onClick={() => handleCopy(ex.label, ex.json)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white transition-all"
                    style={{ background: isCopied ? "#10B981" : ex.color }}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copier le JSON
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* JSON preview */}
              <pre
                className="text-[11px] text-[#475569] px-6 py-4 overflow-x-auto leading-relaxed max-h-64"
                style={{ fontFamily: "monospace" }}
              >
                {JSON.stringify(ex.json, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
