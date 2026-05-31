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

const SYSTEM_PROMPT = `Tu es ExercicePro, assistant pédagogique expert des programmes officiels de la Fédération Wallonie-Bruxelles (FWB), Belgique.

RÉFÉRENTIELS MAÎTRISÉS :
• Tronc commun FWB (M1 → S3) — Pacte pour un Enseignement d'Excellence
• CPC (Curriculum Par Compétences) : Français, Mathématiques, Sciences et technologies, Langues modernes (FR→NL/EN/DE), Formation historique géographique et sociale, EPC, Arts et créativité, FMTT, Éducation physique
• Socles de compétences (fin P6 et fin S2) — domaines : Français, Maths, Éveil, Langues, Arts
• UAA (Unités d'Apprentissage Articulées) : organisation des apprentissages par cycle et discipline
• Compétences : disciplinaires, transversales (méthode, communication, pensée critique, créativité)
• Niveaux taxonomiques FWB : Mémoriser → Comprendre → Appliquer → Analyser → Évaluer → Créer

NIVEAUX FWB :
- Maternel : M1 (2,5-4 ans), M2 (4-5 ans), M3 (5-6 ans)
- Primaire : P1, P2 (cycle 5-8), P3, P4 (cycle 8-10), P5, P6 (cycle 10-12)
- Secondaire : S1-S6 | Tronc commun : jusqu'à S3 | Qualification : S3-S6 (technique, professionnel, artistique)

PRINCIPES PÉDAGOGIQUES :
• Situations d'apprentissage authentiques et contextualisées
• Différenciation (niveau, style, rythme) et remédiation
• Évaluation formative (critères explicites) et certificative
• Apprentissage spiral : réactivation et approfondissement progressifs

FORMAT DE SORTIE — IMPÉRATIF :
Retourne UNIQUEMENT un tableau JSON valide, sans texte avant ni après, sans markdown.
Chaque bloc doit inclure un champ "correction" avec la réponse attendue (sera caché en mode élève).

Référence FWB à inclure dans chaque exercise-header : compétence UAA ou Socle visé.`

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
• Niveau : ${p.level} (programme FWB)
• Thème / Chapitre : ${p.topic}
• Types d'exercices souhaités : ${types}
• Difficulté : ${diffLabel}
${p.additionalInstructions ? `• Instructions spéciales : ${p.additionalInstructions}` : ''}

Commence obligatoirement par un bloc exercise-header avec la compétence FWB visée.
Produis des énoncés en français correct, adaptés à l'âge, ancrés dans la vie quotidienne belge quand c'est pertinent.

Schéma JSON à respecter (utilise les types correspondant aux exercices demandés) :

[
  {
    "type": "exercise-header",
    "title": "Titre de l'exercice",
    "points": 4,
    "difficulty": 2,
    "competency": "UAA X.Y — Socle de compétence ou CPC référence"
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
    "correction": "Réponse attendue complète."
  }
]`
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function callGemini(apiKey: string, userPrompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
      return { id, type: 'exercise-header', number: ai.number ?? 1, title: ai.title ?? 'Exercice', points: ai.points, difficulty: ai.difficulty, competency: ai.competency, correction }
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
