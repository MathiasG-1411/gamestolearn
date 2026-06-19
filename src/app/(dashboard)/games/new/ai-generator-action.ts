"use server";

import Anthropic from "@anthropic-ai/sdk";

const PROMPTS: Record<string, (subject: string, grade: string) => string> = {
  escape: (subject, grade) => `Génère un Escape Game pour des élèves de ${grade} sur le thème "${subject}".
4 questions exactement. Retourne UNIQUEMENT ce JSON:
{
  "title": "titre accrocheur",
  "scenario": "contexte narratif immersif (2-3 phrases)",
  "setting": "emoji",
  "questions": [
    {
      "question": "question éducative",
      "choices": ["A", "B", "C", "D"],
      "correctIndex": 1,
      "codeDigit": "3",
      "wrongHint": "indice si mauvaise réponse"
    }
  ]
}
Varie les correctIndex. codeDigit = chiffre unique (0-9).`,

  aventure: (subject, grade) => `Génère un jeu d'aventure "Livre dont vous êtes le héros" pour des élèves de ${grade} sur "${subject}".
3 chapitres principaux + 3 chapitres de rattrapage (ch1_retry, ch2_retry, ch3_retry).
Retourne UNIQUEMENT ce JSON:
{
  "title": "titre accrocheur",
  "theme": "foret",
  "intro": "introduction en 2 phrases",
  "character": "nom personnage",
  "characterEmoji": "emoji",
  "chapters": [
    {"id":"ch1","narrative":"texte narratif","challenge":{"question":"question","choices":["A","B","C","D"],"correctIndex":1,"correctFeedback":"réaction positive","wrongFeedback":"indice"},"correctNext":"ch2","wrongNext":"ch1_retry"},
    {"id":"ch1_retry","narrative":"explication supplémentaire","challenge":{"question":"question reformulée","choices":["A","B","C","D"],"correctIndex":1,"correctFeedback":"bravo","wrongFeedback":"encouragement"},"correctNext":"ch2","wrongNext":"ch1_retry"},
    {"id":"ch2","narrative":"suite de l'histoire","challenge":{"question":"2e question","choices":["A","B","C","D"],"correctIndex":0,"correctFeedback":"super","wrongFeedback":"indice"},"correctNext":"ch3","wrongNext":"ch2_retry"},
    {"id":"ch2_retry","narrative":"explication","challenge":{"question":"reformulation","choices":["A","B","C","D"],"correctIndex":0,"correctFeedback":"bien","wrongFeedback":"aide"},"correctNext":"ch3","wrongNext":"ch2_retry"},
    {"id":"ch3","narrative":"climax","challenge":{"question":"3e question","choices":["A","B","C","D"],"correctIndex":2,"correctFeedback":"victoire!","wrongFeedback":"indice final"},"correctNext":"end_good","wrongNext":"ch3_retry"},
    {"id":"ch3_retry","narrative":"dernier indice","challenge":{"question":"question finale","choices":["A","B","C","D"],"correctIndex":2,"correctFeedback":"bravo","wrongFeedback":"essaie encore"},"correctNext":"end_good","wrongNext":"ch3_retry"}
  ],
  "startChapterId": "ch1",
  "endingGood": {"text":"message de victoire","emoji":"🏆","xp":100},
  "endingBad": {"text":"message consolation","emoji":"📚","xp":50}
}
theme = foret|espace|chateau|mer|ville. Varie les correctIndex.`,

  mission: (subject, grade) => `Génère une Mission pédagogique pour des élèves de ${grade} sur "${subject}".
2 phases, 3 questions chacune. Retourne UNIQUEMENT ce JSON:
{
  "title": "Opération [titre]",
  "emoji": "emoji thématique",
  "briefing": "briefing dramatique en 2 phrases",
  "objective": "objectif pédagogique court",
  "phases": [
    {
      "id": "phase1",
      "title": "Phase 1 : [nom]",
      "narrative": "contexte de la phase",
      "questions": [
        {"question":"question","choices":["A","B","C","D"],"correctIndex":0,"explanation":"explication courte"},
        {"question":"question","choices":["A","B","C","D"],"correctIndex":2,"explanation":"explication"},
        {"question":"question","choices":["A","B","C","D"],"correctIndex":1,"explanation":"explication"}
      ],
      "xpReward": 50
    },
    {
      "id": "phase2",
      "title": "Phase 2 : [nom]",
      "narrative": "contexte phase 2",
      "questions": [
        {"question":"question","choices":["A","B","C","D"],"correctIndex":3,"explanation":"explication"},
        {"question":"question","choices":["A","B","C","D"],"correctIndex":0,"explanation":"explication"},
        {"question":"question","choices":["A","B","C","D"],"correctIndex":1,"explanation":"explication"}
      ],
      "xpReward": 75
    }
  ],
  "bossChallenge": {
    "narrative": "défi final dramatique",
    "question": "question de boss",
    "choices": ["A","B","C","D"],
    "correctIndex": 2
  },
  "debrief": "texte de débriefing final"
}`,

  quiz: (subject, grade) => `Génère un Quiz pour des élèves de ${grade} sur "${subject}".
6 questions. Retourne UNIQUEMENT ce JSON:
{
  "title": "titre du quiz",
  "questions": [
    {"question":"question","choices":["A","B","C","D"],"correctIndex":0}
  ],
  "timePerQuestion": 20
}
Varie les correctIndex.`,

  memory: (subject, grade) => `Génère un Memory pour des élèves de ${grade} sur "${subject}".
8 paires mot+emoji. Retourne UNIQUEMENT ce JSON:
{
  "title": "titre",
  "pairs": [
    {"word": "mot du vocabulaire", "emoji": "emoji associé"}
  ]
}`,

  anagram: (subject, grade) => `Génère un Anagramme pour des élèves de ${grade} sur "${subject}".
5 mots en rapport avec le sujet. Retourne UNIQUEMENT ce JSON:
{
  "title": "titre",
  "words": [
    {"word": "MOT", "hint": "définition courte", "emoji": "emoji"}
  ]
}
Les mots doivent être en MAJUSCULES.`,

  plateau: (subject, grade) => `Génère un Jeu de Plateau pour des élèves de ${grade} sur "${subject}".
12 cases : 8 questions, 2 bonus, 1 repos, 1 malus (mélangés). Retourne UNIQUEMENT ce JSON:
{
  "title": "titre accrocheur",
  "theme": "jungle",
  "narrative": "introduction immersive en 2 phrases",
  "characterEmoji": "emoji personnage",
  "spaces": [
    {"position":1,"type":"question","question":"question","choices":["A","B","C","D"],"correctIndex":0,"correctFeedback":"bravo!","wrongFeedback":"indice"},
    {"position":2,"type":"bonus","narrative":"texte bonus","bonusSpaces":2},
    {"position":3,"type":"question","question":"question","choices":["A","B","C","D"],"correctIndex":2,"correctFeedback":"super!","wrongFeedback":"indice"},
    {"position":4,"type":"repos","narrative":"texte repos"},
    {"position":5,"type":"question","question":"question","choices":["A","B","C","D"],"correctIndex":1,"correctFeedback":"excellent!","wrongFeedback":"indice"},
    {"position":6,"type":"malus","narrative":"texte malus","malusSpaces":1},
    {"position":7,"type":"question","question":"question","choices":["A","B","C","D"],"correctIndex":3,"correctFeedback":"bien!","wrongFeedback":"indice"},
    {"position":8,"type":"bonus","narrative":"texte bonus","bonusSpaces":1},
    {"position":9,"type":"question","question":"question","choices":["A","B","C","D"],"correctIndex":0,"correctFeedback":"parfait!","wrongFeedback":"indice"},
    {"position":10,"type":"question","question":"question","choices":["A","B","C","D"],"correctIndex":2,"correctFeedback":"bravo!","wrongFeedback":"indice"},
    {"position":11,"type":"question","question":"question","choices":["A","B","C","D"],"correctIndex":1,"correctFeedback":"super!","wrongFeedback":"indice"},
    {"position":12,"type":"question","question":"question","choices":["A","B","C","D"],"correctIndex":3,"correctFeedback":"victoire!","wrongFeedback":"indice"}
  ],
  "endNarrative": "message de victoire en 2 phrases"
}
theme = jungle|espace|desert|ocean. Varie les correctIndex.`,

  cartes: (subject, grade) => `Génère un Jeu de Cartes éducatif pour des élèves de ${grade} sur "${subject}".
6 cartes. Retourne UNIQUEMENT ce JSON:
{
  "title": "titre accrocheur",
  "narrative": "intro dramatique en 2 phrases",
  "setting": "emoji décor",
  "playerName": "Héros",
  "playerEmoji": "emoji joueur",
  "enemyName": "nom ennemi thématique",
  "enemyEmoji": "emoji ennemi",
  "playerMaxHP": 100,
  "enemyMaxHP": 100,
  "cards": [
    {"id":"c1","name":"nom carte","emoji":"emoji","type":"attack","question":"question","choices":["A","B","C","D"],"correctIndex":0,"power":20,"description":"description courte","wrongPenalty":10},
    {"id":"c2","name":"nom carte","emoji":"emoji","type":"defense","question":"question","choices":["A","B","C","D"],"correctIndex":1,"power":15,"description":"description","wrongPenalty":8},
    {"id":"c3","name":"nom carte","emoji":"emoji","type":"special","question":"question","choices":["A","B","C","D"],"correctIndex":2,"power":25,"description":"description","wrongPenalty":12},
    {"id":"c4","name":"nom carte","emoji":"emoji","type":"attack","question":"question","choices":["A","B","C","D"],"correctIndex":3,"power":18,"description":"description","wrongPenalty":10},
    {"id":"c5","name":"nom carte","emoji":"emoji","type":"defense","question":"question","choices":["A","B","C","D"],"correctIndex":0,"power":20,"description":"description","wrongPenalty":9},
    {"id":"c6","name":"nom carte","emoji":"emoji","type":"special","question":"question","choices":["A","B","C","D"],"correctIndex":1,"power":30,"description":"description","wrongPenalty":15}
  ]
}
Alterne attack/defense/special. power entre 15-30, wrongPenalty entre 8-15. Varie les correctIndex.`,

  defi: (subject, grade) => `Génère un Défi Chronométré pour des élèves de ${grade} sur "${subject}".
6 défis, 90 secondes. Retourne UNIQUEMENT ce JSON:
{
  "title": "Défi : [titre accrocheur]",
  "emoji": "emoji thématique",
  "narrative": "intro urgente et dramatique en 2 phrases",
  "totalTimeSeconds": 90,
  "challenges": [
    {"question":"question courte et directe","choices":["A","B","C","D"],"correctIndex":0,"points":100,"timeBonusSeconds":5},
    {"question":"question","choices":["A","B","C","D"],"correctIndex":2,"points":100},
    {"question":"question","choices":["A","B","C","D"],"correctIndex":1,"points":150,"timeBonusSeconds":8},
    {"question":"question","choices":["A","B","C","D"],"correctIndex":3,"points":100},
    {"question":"question","choices":["A","B","C","D"],"correctIndex":0,"points":200,"timeBonusSeconds":10},
    {"question":"question finale difficile","choices":["A","B","C","D"],"correctIndex":2,"points":250}
  ]
}
Varie les correctIndex. timeBonusSeconds optionnel (3-10s). Points croissants.`,

  construction: (subject, grade) => `Génère un Jeu de Construction Progressive pour des élèves de ${grade} sur "${subject}".
6 pièces. Retourne UNIQUEMENT ce JSON:
{
  "title": "titre accrocheur",
  "narrative": "introduction immersive en 2 phrases",
  "buildTarget": "ce qu'on construit (ex: une fusée, un château, une cellule)",
  "buildEmoji": "emoji représentant l'objet fini",
  "pieces": [
    {"id":"p1","name":"nom de la pièce","emoji":"emoji pièce","question":"question","choices":["A","B","C","D"],"correctIndex":0,"hint":"indice si erreur","unlockText":"texte de découverte de la pièce"},
    {"id":"p2","name":"nom","emoji":"emoji","question":"question","choices":["A","B","C","D"],"correctIndex":2,"hint":"indice","unlockText":"texte"},
    {"id":"p3","name":"nom","emoji":"emoji","question":"question","choices":["A","B","C","D"],"correctIndex":1,"hint":"indice","unlockText":"texte"},
    {"id":"p4","name":"nom","emoji":"emoji","question":"question","choices":["A","B","C","D"],"correctIndex":3,"hint":"indice","unlockText":"texte"},
    {"id":"p5","name":"nom","emoji":"emoji","question":"question","choices":["A","B","C","D"],"correctIndex":0,"hint":"indice","unlockText":"texte"},
    {"id":"p6","name":"nom","emoji":"emoji","question":"question","choices":["A","B","C","D"],"correctIndex":2,"hint":"indice","unlockText":"texte"}
  ],
  "completionText": "message de félicitation décrivant la construction terminée"
}
Varie les correctIndex.`,
};

export async function generateGameWithAI(
  gameType: string,
  subject: string,
  gradeLevel: string
): Promise<{ success: boolean; config?: string; title?: string; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "Clé API manquante. Ajoutez ANTHROPIC_API_KEY dans .env.local",
    };
  }

  const promptFn = PROMPTS[gameType];
  if (!promptFn) {
    return { success: false, error: `Type "${gameType}" non supporté pour la génération IA` };
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3500,
      system:
        "Tu es un expert en jeux éducatifs pour l'école primaire française. " +
        "Tu génères des configurations de jeux en JSON valide. " +
        "Tout le contenu est en français, adapté à l'âge. " +
        "Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans explication.",
      messages: [{ role: "user", content: promptFn(subject, gradeLevel) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : null;
    if (!raw) return { success: false, error: "Réponse vide" };

    // Strip markdown code fences if present
    let jsonStr = raw;
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    } else {
      const objMatch = raw.match(/\{[\s\S]*\}/);
      if (objMatch) jsonStr = objMatch[0];
    }

    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const title =
      typeof parsed.title === "string"
        ? parsed.title
        : `${subject} — ${gradeLevel}`;

    return { success: true, config: jsonStr, title };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Erreur IA : ${msg}` };
  }
}
