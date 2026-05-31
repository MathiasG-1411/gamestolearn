import { v4 as uuidv4 } from 'uuid'
import type { Block } from '../types/worksheet'

export type AIProvider = 'gemini' | 'groq'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
}

export interface AIGenerateParams {
  subject: string
  level: string
  topic: string
  exerciseTypes: string[]
  difficulty: 1 | 2 | 3
  count: number
  additionalInstructions?: string
}

const AI_CONFIG_KEY = 'fichespro_ai_config'

export function loadAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveAIConfig(cfg: AIConfig): void {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg))
}

// ─── System prompt FWB ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es ExercicePro, assistant pédagogique expert exclusif des nouveaux référentiels officiels de la Fédération Wallonie-Bruxelles (FWB), Belgique.

⚠️ RÉFÉRENTIEL UNIQUE — NOUVEAUX CPC UNIQUEMENT :
Tu utilises EXCLUSIVEMENT les nouveaux Curricula Par Compétences (CPC) du Tronc commun FWB, issus du Pacte pour un Enseignement d'Excellence (depuis 2020, progressivement en vigueur).
Tu n'utilises PAS les anciens Socles de compétences (document d'avant 2020, désormais remplacé).

DISCIPLINES CPC DU TRONC COMMUN (M1 → S3) :
• Français · Mathématiques · Sciences et technologies · Langues modernes (NL, EN, DE)
• Formation historique, géographique et sociale (FHGS) · Éducation à la philosophie et à la citoyenneté (EPC)
• Arts et créativité · Formation manuelle, technique et technologique (FMTT) · Éducation physique et à la santé (EPAS)

STRUCTURE DES CPC — TROIS CATÉGORIES D'APPRENTISSAGE :
1. SAVOIRS (S) : connaissances déclaratives, faits, notions, concepts, règles, définitions à mémoriser et comprendre.
   → Exemple : "Connaître les tables de multiplication jusqu'à 10×10" ou "Connaître les accords sujet-verbe"
2. SAVOIR-FAIRE (SF) : procédures, techniques, démarches à maîtriser et appliquer.
   → Exemple : "Effectuer une division euclidienne" ou "Rédiger un texte argumentatif structuré"
3. COMPÉTENCES (C) : mobilisation et intégration de savoirs + savoir-faire dans des situations complexes et inédites.
   → Exemple : "Résoudre un problème de la vie quotidienne en mobilisant les quatre opérations"

ATTENDUS — CONCEPT CENTRAL :
Les Attendus sont les formulations précises des résultats d'apprentissage à atteindre à la fin de chaque cycle.
• Ils sont formulés par discipline et par cycle dans les CPC
• Ils définissent CE QUI EST DEMANDÉ à l'élève : base des évaluations et des bulletins scolaires
• Chaque attendu appartient à une catégorie : S (Savoir), SF (Savoir-faire) ou C (Compétence)
• Ils sont organisés par UAA (Unités d'Apprentissage Articulées), ex. "UAA 3.2 — Mathématiques"
→ Dans CHAQUE exercice généré, tu dois identifier et indiquer l'attendu CPC visé avec son type (S/SF/C) et son code UAA.

CYCLES ET NIVEAUX FWB :
- Cycle 1 (Maternel) : M1, M2, M3 — attendus de fin de M3
- Cycle 2 (Primaire inf.) : P1, P2 — attendus de fin de P2
- Cycle 3 (Primaire moy.) : P3, P4 — attendus de fin de P4
- Cycle 4 (Primaire sup.) : P5, P6 — attendus de fin de P6
- Cycle 5 (Secondaire inf.) : S1, S2 — attendus de fin de S2
- Cycle 6 (Secondaire moy.) : S3 — attendus de fin de S3 (fin du Tronc commun)

PRINCIPES PÉDAGOGIQUES FWB :
• Situations d'apprentissage significatives, contextualisées dans la vie réelle belge
• Progression taxonomique : Mémoriser → Comprendre → Appliquer → Analyser → Évaluer → Créer
• Évaluation critériée (certificative) et formative alignée sur les Attendus
• Différenciation et remédiation

FORMAT DE SORTIE — IMPÉRATIF :
Retourne UNIQUEMENT un tableau JSON valide, sans texte avant ni après, sans markdown, sans commentaires.
Chaque bloc exercice DOIT inclure un champ "correction" avec la réponse attendue complète (sera caché en mode élève).
Chaque exercise-header DOIT inclure : attendu (texte exact de l'attendu CPC), attenduType (S/SF/C), attenduCode (ex: "UAA 3.2 — Mathématiques").`

// ─── User prompt builder ──────────────────────────────────────────────────────

function buildUserPrompt(p: AIGenerateParams): string {
  const diffLabel = p.difficulty === 1 ? '1/3 — Découverte / mémorisation (bas de taxonomie)' : p.difficulty === 2 ? '2/3 — Application / analyse (mi-taxonomie)' : '3/3 — Évaluation / création (haut de taxonomie)'
  const typesDesc: Record<string, string> = {
    'qcm': 'QCM (4 options)',
    'true-false': 'Vrai/Faux',
    'fill-blank': 'Texte à trous avec banque de mots',
    'matching': 'Relier (2 colonnes)',
    'open': 'Question ouverte (réponse sur lignes)',
    'computation': 'Calcul / résolution de problème',
  }
  const types = p.exerciseTypes.map(t => typesDesc[t] || t).join(', ')

  return `Génère ${p.count} exercice(s) pour :
• Matière : ${p.subject}
• Niveau : ${p.level} (Tronc commun FWB — nouveaux CPC)
• Thème / Chapitre : ${p.topic}
• Types d'exercices souhaités : ${types}
• Difficulté : ${diffLabel}
${p.additionalInstructions ? `• Instructions spéciales : ${p.additionalInstructions}` : ''}

IMPORTANT :
- Commence par un bloc exercise-header avec l'attendu CPC exact visé (pas les anciens Socles).
- L'attendu doit être formulé précisément comme dans les CPC (ex: "Calculer le périmètre et l'aire de figures planes").
- Produis des énoncés en français correct, adaptés à l'âge, ancrés dans la vie quotidienne belge.
- Chaque exercice doit inclure une "correction" complète.

Schéma JSON à respecter STRICTEMENT :

[
  {
    "type": "exercise-header",
    "title": "Titre de l'exercice",
    "number": 1,
    "points": 4,
    "difficulty": 2,
    "attendu": "Texte exact de l'attendu CPC visé (ex: Résoudre des problèmes additifs et multiplicatifs)",
    "attenduType": "SF",
    "attenduCode": "UAA 3.2 — Mathématiques"
  },
  {
    "type": "text",
    "content": "Consigne ou contexte de la situation d'apprentissage."
  },
  {
    "type": "qcm",
    "question": "La question ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "style": "letters",
    "multipleAnswers": false,
    "correction": "La réponse est A car..."
  },
  {
    "type": "true-false",
    "instruction": "Indique si chaque affirmation est vraie ou fausse.",
    "statements": ["Affirmation 1", "Affirmation 2", "Affirmation 3"],
    "correction": "1: Vrai — 2: Faux — 3: Vrai"
  },
  {
    "type": "fill-blank",
    "instruction": "Complète avec les mots de la banque.",
    "text": "Le ___ est la capitale de la ___.",
    "wordBank": ["Bruxelles", "Belgique", "Paris"],
    "showWordBank": true,
    "correction": "Bruxelles / Belgique"
  },
  {
    "type": "matching",
    "instruction": "Relie chaque terme à sa définition.",
    "leftItems": ["Terme 1", "Terme 2"],
    "rightItems": ["Définition A", "Définition B"],
    "correction": "1-A, 2-B"
  },
  {
    "type": "exercise-item",
    "questionText": "Question ouverte ou problème à résoudre.",
    "questionStyle": "plain",
    "answerStyle": "lines",
    "lineCount": 4,
    "boxHeight": "md",
    "qcmOptions": [],
    "qcmOptionStyle": "letters",
    "layout": "stacked",
    "correction": "Réponse attendue complète."
  }
]`
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function callGemini(apiKey: string, userPrompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.75, maxOutputTokens: 4096 },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message || `Gemini error ${res.status}`)
  }
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callGroq(apiKey: string, userPrompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 4096,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message || `Groq error ${res.status}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

// ─── JSON extraction + block conversion ──────────────────────────────────────

function extractJSON(raw: string): string {
  // Strip markdown code fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  // Find first [ ... ]
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start !== -1 && end > start) return raw.slice(start, end + 1)
  return raw.trim()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aiBlockToBlock(ai: Record<string, any>): Block | null {
  const id = uuidv4()
  const correction: string | undefined = ai.correction || undefined

  switch (ai.type) {
    case 'exercise-header':
      return { id, type: 'exercise-header', number: ai.number ?? 1, title: ai.title ?? 'Exercice', points: ai.points, difficulty: ai.difficulty, attendu: ai.attendu, attenduType: ai.attenduType, attenduCode: ai.attenduCode, competency: ai.competency, correction }
    case 'text':
      return { id, type: 'text', content: ai.content ?? '', correction }
    case 'qcm':
      return { id, type: 'qcm', question: ai.question ?? '', options: ai.options ?? ['', '', '', ''], style: ai.style ?? 'letters', multipleAnswers: false, correction }
    case 'true-false':
      return { id, type: 'true-false', instruction: ai.instruction, statements: ai.statements ?? [], correction }
    case 'fill-blank':
      return { id, type: 'fill-blank', instruction: ai.instruction, text: ai.text ?? '', wordBank: ai.wordBank ?? [], showWordBank: ai.showWordBank ?? true, correction }
    case 'matching':
      return { id, type: 'matching', instruction: ai.instruction, leftItems: ai.leftItems ?? [], rightItems: ai.rightItems ?? [], correction }
    case 'exercise-item':
      return { id, type: 'exercise-item', questionText: ai.questionText ?? '', questionStyle: ai.questionStyle ?? 'plain', answerStyle: ai.answerStyle ?? 'lines', lineCount: ai.lineCount ?? 4, boxHeight: ai.boxHeight ?? 'md', qcmOptions: ai.qcmOptions ?? [], qcmOptionStyle: 'letters', layout: 'stacked', correction }
    default:
      return null
  }
}

export async function generateExercises(cfg: AIConfig, params: AIGenerateParams): Promise<Block[]> {
  const userPrompt = buildUserPrompt(params)
  const raw = cfg.provider === 'gemini'
    ? await callGemini(cfg.apiKey, userPrompt)
    : await callGroq(cfg.apiKey, userPrompt)

  const jsonStr = extractJSON(raw)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed: any[] = JSON.parse(jsonStr)
  if (!Array.isArray(parsed)) throw new Error('La réponse IA n\'est pas un tableau JSON.')

  const blocks: Block[] = []
  for (const item of parsed) {
    const block = aiBlockToBlock(item)
    if (block) blocks.push(block)
  }
  if (blocks.length === 0) throw new Error('Aucun bloc valide généré.')
  return blocks
}
