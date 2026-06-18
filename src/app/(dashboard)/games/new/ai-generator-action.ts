"use server";
import Anthropic from "@anthropic-ai/sdk";

export async function generateGameWithAI(
  gameType: string,
  subject: string,
  gradeLevel: string,
): Promise<{ success: boolean; config?: string; title?: string; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Clé API non configurée. Ajoutez ANTHROPIC_API_KEY dans .env.local" };
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = `Tu es un expert en conception de jeux éducatifs pour l'école primaire française.
Génère des configurations de jeux éducatifs en JSON valide.
Utilise le français pour tout le contenu.
Rends le contenu engageant, narratif et adapté à l'âge.
Réponds UNIQUEMENT avec du JSON valide, sans markdown ni explication.`;

  let userPrompt = "";

  if (gameType === "escape") {
    userPrompt = `Génère un Escape Game pour des élèves de ${gradeLevel} sur le thème "${subject}".
Le jeu doit avoir exactement 4 questions. Retourne ce JSON exact:
{
  "title": "titre accrocheur du jeu",
  "scenario": "contexte narratif en 2-3 phrases",
  "setting": "un seul emoji représentant le lieu",
  "questions": [
    {
      "question": "question éducative",
      "choices": ["choix A", "choix B", "choix C", "choix D"],
      "correctIndex": 0,
      "codeDigit": "X",
      "wrongHint": "indice si mauvaise réponse"
    }
  ]
}
Les codeDigit forment un code à 4 chiffres. Varie les correctIndex (pas toujours 0).`;
  } else if (gameType === "aventure") {
    userPrompt = `Génère un jeu d'aventure "Livre dont vous êtes le héros" pour des élèves de ${gradeLevel} sur "${subject}".
Inclus exactement 3 chapitres principaux + 3 chapitres de rattrapage (1 par chapitre principal).
Retourne ce JSON exact:
{
  "title": "titre accrocheur",
  "theme": "foret|espace|chateau|mer|ville",
  "intro": "texte d'introduction en 2 phrases",
  "character": "nom du personnage PNJ",
  "characterEmoji": "un emoji",
  "chapters": [
    {
      "id": "ch1",
      "narrative": "texte narratif (2-3 phrases)",
      "challenge": {
        "question": "question éducative",
        "choices": ["A", "B", "C", "D"],
        "correctIndex": 1,
        "correctFeedback": "réaction positive narrative",
        "wrongFeedback": "indice utile"
      },
      "correctNext": "ch2",
      "wrongNext": "ch1_retry"
    },
    {
      "id": "ch1_retry",
      "narrative": "explication supplémentaire",
      "challenge": {
        "question": "même question reformulée",
        "choices": ["A", "B", "C", "D"],
        "correctIndex": 1,
        "correctFeedback": "bravo",
        "wrongFeedback": "encouragement"
      },
      "correctNext": "ch2",
      "wrongNext": "ch1_retry"
    },
    {
      "id": "ch2",
      "narrative": "suite narrative",
      "challenge": { "question": "...", "choices": ["...","...","...","..."], "correctIndex": 0, "correctFeedback": "...", "wrongFeedback": "..." },
      "correctNext": "ch3",
      "wrongNext": "ch2_retry"
    },
    {
      "id": "ch2_retry",
      "narrative": "explication",
      "challenge": { "question": "...", "choices": ["...","...","...","..."], "correctIndex": 0, "correctFeedback": "...", "wrongFeedback": "..." },
      "correctNext": "ch3",
      "wrongNext": "ch2_retry"
    },
    {
      "id": "ch3",
      "narrative": "climax narratif",
      "challenge": { "question": "...", "choices": ["...","...","...","..."], "correctIndex": 2, "correctFeedback": "...", "wrongFeedback": "..." },
      "correctNext": "end_good",
      "wrongNext": "ch3_retry"
    },
    {
      "id": "ch3_retry",
      "narrative": "dernier indice",
      "challenge": { "question": "...", "choices": ["...","...","...","..."], "correctIndex": 2, "correctFeedback": "...", "wrongFeedback": "..." },
      "correctNext": "end_good",
      "wrongNext": "ch3_retry"
    }
  ],
  "startChapterId": "ch1",
  "endingGood": { "text": "message de victoire (2 phrases)", "emoji": "🏆", "xp": 100 },
  "endingBad": { "text": "message de consolation", "emoji": "📚", "xp": 50 }
}`;
  } else if (gameType === "mission") {
    userPrompt = `Génère une Mission pédagogique pour des élèves de ${gradeLevel} sur "${subject}".
La mission doit avoir exactement 2 phases (3-4 questions chacune). Retourne ce JSON exact:
{
  "title": "Opération [titre accrocheur]",
  "emoji": "un emoji thématique",
  "briefing": "texte de briefing dramatique (3 phrases)",
  "objective": "Objectif d'apprentissage court",
  "phases": [
    {
      "id": "phase1",
      "title": "Phase 1 : [nom de phase]",
      "narrative": "contexte narratif de la phase",
      "questions": [
        {
          "question": "question éducative",
          "choices": ["A", "B", "C", "D"],
          "correctIndex": 1,
          "explanation": "explication courte"
        }
      ],
      "xpReward": 50
    },
    {
      "id": "phase2",
      "title": "Phase 2 : [nom]",
      "narrative": "contexte phase 2",
      "questions": [{ "question": "...", "choices": ["...","...","...","..."], "correctIndex": 0, "explanation": "..." }],
      "xpReward": 75
    }
  ],
  "bossChallenge": {
    "narrative": "narratif du défi final dramatique",
    "question": "question de boss",
    "choices": ["A", "B", "C", "D"],
    "correctIndex": 2
  },
  "debrief": "texte de débriefing final (2 phrases)"
}`;
  } else if (gameType === "quiz") {
    userPrompt = `Génère un Quiz chronométré pour des élèves de ${gradeLevel} sur "${subject}".
Retourne ce JSON exact:
{
  "title": "titre du quiz",
  "questions": [
    {
      "question": "question",
      "choices": ["A", "B", "C", "D"],
      "correctIndex": 0
    }
  ],
  "timePerQuestion": 20
}
Inclus exactement 6 questions. Varie les correctIndex.`;
  } else if (gameType === "memory") {
    userPrompt = `Génère un jeu de Memory pour des élèves de ${gradeLevel} sur "${subject}".
Retourne ce JSON exact:
{
  "title": "titre du jeu",
  "pairs": [
    { "word": "mot", "emoji": "emoji associé" }
  ]
}
Inclus exactement 8 paires. Utilise des emojis pertinents.`;
  } else if (gameType === "anagram") {
    userPrompt = `Génère un jeu d'Anagramme pour des élèves de ${gradeLevel} sur "${subject}".
Retourne ce JSON exact:
{
  "title": "titre",
  "words": [
    { "word": "MOT", "hint": "définition courte", "emoji": "emoji" }
  ]
}
Inclus exactement 5 mots en MAJUSCULES. Choisis des mots du vocabulaire lié au sujet.`;
  } else {
    return { success: false, error: `Type de jeu non supporté: ${gameType}` };
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0].type === "text" ? message.content[0].text.trim() : null;
    if (!content) return { success: false, error: "Réponse vide de l'IA" };

    let jsonStr = content;
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1].trim();
    else {
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) jsonStr = objMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    const title = parsed.title ?? `${subject} - ${gradeLevel}`;
    return { success: true, config: jsonStr, title };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { success: false, error: `Erreur de génération: ${message}` };
  }
}
