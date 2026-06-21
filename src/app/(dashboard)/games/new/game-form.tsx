"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createGame } from "./actions";

// ── image-click types ──────────────────────────────────────────────
type Choice = { emoji: string; label: string; isCorrect: boolean };
type Round = { instruction: string; choices: Choice[] };

const EMPTY_ROUND = (): Round => ({
  instruction: "",
  choices: [
    { emoji: "", label: "", isCorrect: true },
    { emoji: "", label: "", isCorrect: false },
    { emoji: "", label: "", isCorrect: false },
    { emoji: "", label: "", isCorrect: false },
  ],
});

// ── memory types ────────────────────────────────────────────────────
type MemoryPair = { id: string; word: string; emoji: string };
const EMPTY_PAIR = (): MemoryPair => ({ id: crypto.randomUUID(), word: "", emoji: "" });

// ── quiz types ───────────────────────────────────────────────────────
type QuizQuestion = { question: string; choices: string[]; correctIndex: number };
const EMPTY_QUESTION = (): QuizQuestion => ({
  question: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
});

// ── anagram types ────────────────────────────────────────────────────
type AnagramWord = { word: string; hint: string; emoji: string };
const EMPTY_WORD = (): AnagramWord => ({ word: "", hint: "", emoji: "" });

// ── escape types ─────────────────────────────────────────────────────
type EscapeQuestion = { question: string; choices: string[]; correctIndex: number; codeDigit: string; wrongHint: string };
const EMPTY_ESCAPE_Q = (): EscapeQuestion => ({
  question: "", choices: ["", "", "", ""], correctIndex: 0, codeDigit: "", wrongHint: "",
});

// ── enquete types ────────────────────────────────────────────────────
type EnqueteQuestion = { question: string; choices: string[]; correctIndex: number; clue: string; clueEmoji: string; wrongHint: string };
const EMPTY_ENQUETE_Q = (): EnqueteQuestion => ({
  question: "", choices: ["", "", "", ""], correctIndex: 0, clue: "", clueEmoji: "", wrongHint: "",
});

// ── game types ───────────────────────────────────────────────────────
const GAME_TYPES = [
  { value: "quete", label: "🧭 Quête", desc: "Plusieurs salles, inventaire, explications + remédiation" },
  { value: "escape", label: "🔓 Escape Game", desc: "Résous des énigmes pour trouver le code secret" },
  { value: "aventure", label: "📖 Aventure", desc: "Livre dont tu es le héros — narration + choix" },
  { value: "mission", label: "🎯 Mission", desc: "Mission multi-phases avec boss final" },
  { value: "plateau", label: "🎲 Jeu de plateau", desc: "Avance sur le plateau en répondant correctement" },
  { value: "cartes", label: "🃏 Jeu de cartes", desc: "Duel RPG — active tes cartes en répondant" },
  { value: "defi", label: "⚡ Défi chronométré", desc: "Course contre la montre — réponds vite !" },
  { value: "construction", label: "🔧 Construction", desc: "Débloque des pièces pour construire quelque chose" },
  { value: "enquete", label: "🔍 Enquête", desc: "Collecte des indices pour résoudre le mystère" },
  { value: "image-click", label: "🖼️ Clique sur la bonne image", desc: "4 choix avec emoji, un seul correct" },
  { value: "memory", label: "🧠 Memory", desc: "Associe les paires emoji ↔ mot" },
  { value: "quiz", label: "⏱️ Quiz chronométré", desc: "QCM avec minuterie par question" },
  { value: "anagram", label: "🔤 Anagramme", desc: "Remets les lettres dans l'ordre" },
];

const COMPLEX_TYPES = ["quete", "aventure", "mission", "plateau", "cartes", "defi", "construction"];

const JSON_EXAMPLES: Record<string, string> = {
  quete: `{
  "title": "Le Laboratoire du Savoir",
  "theme": "chateau",
  "intro": "Le professeur a verrouillé son laboratoire. Traverse les salles en résolvant les épreuves pour récupérer les objets et ouvrir chaque porte !",
  "heroEmoji": "🧭",
  "rooms": [
    {
      "id": "r1",
      "name": "La Salle des Nombres",
      "emoji": "🔢",
      "narrative": "Une porte couverte de chiffres bloque le passage.",
      "challenges": [
        {
          "id": "c1",
          "competence": "Calcul mental",
          "question": "Combien font 7 × 8 ?",
          "choices": ["54", "56", "63"],
          "correctIndex": 1,
          "explanation": "7 × 8 = 56. Astuce : 7 × 8 = (7 × 4) × 2 = 28 × 2 = 56.",
          "remediation": {
            "hint": "Compte de 8 en 8, sept fois.",
            "question": "Combien font 7 × 4 ?",
            "choices": ["28", "32", "24"],
            "correctIndex": 0,
            "explanation": "7 × 4 = 28, et le double donne 7 × 8 = 56."
          },
          "reward": { "item": "Clé de bronze", "emoji": "🗝️" }
        }
      ],
      "exit": {
        "lockedText": "La porte demande la clé de bronze.",
        "unlockText": "La clé de bronze ouvre la porte !"
      }
    }
  ],
  "ending": { "text": "Tu as traversé tout le laboratoire ! Le professeur est impressionné.", "emoji": "🏆" }
}`,
  aventure: `{
  "title": "La Forêt Enchantée",
  "theme": "foret",
  "intro": "Tu entres dans la forêt magique…",
  "character": "Héros",
  "characterEmoji": "🧝",
  "startChapterId": "ch1",
  "chapters": [
    {
      "id": "ch1",
      "narrative": "Un gnome te barre la route.",
      "challenge": {
        "question": "Combien font 6 × 7 ?",
        "choices": ["40", "42", "48"],
        "correctIndex": 1,
        "correctFeedback": "Le gnome s'écarte !",
        "wrongFeedback": "Essaie encore…"
      },
      "correctNext": "end_good",
      "wrongNext": "ch1"
    }
  ],
  "endingGood": { "text": "Tu as traversé la forêt !", "emoji": "🏆", "xp": 100 },
  "endingBad": { "text": "La forêt reste mystérieuse…", "emoji": "😔", "xp": 20 }
}`,
  mission: `{
  "title": "Mission Sciences",
  "narrative": "Agent, ta mission commence maintenant.",
  "phases": [
    {
      "title": "Phase 1 — Infiltration",
      "briefing": "Réponds aux questions pour avancer.",
      "questions": [
        {
          "question": "Quelle planète est la plus proche du Soleil ?",
          "choices": ["Vénus", "Mercure", "Mars"],
          "correctIndex": 1,
          "feedback": "Mercure est bien la plus proche !"
        }
      ]
    }
  ],
  "bossChallenge": {
    "question": "Quelle est la formule de l'eau ?",
    "choices": ["H2O", "CO2", "O2"],
    "correctIndex": 0,
    "rewardText": "Mission accomplie !"
  }
}`,
  plateau: `{
  "title": "Plateau des Maths",
  "theme": "jungle",
  "narrative": "Bienvenue dans la jungle des chiffres !",
  "characterEmoji": "🐒",
  "spaces": [
    {
      "position": 1,
      "type": "question",
      "question": "Combien font 8 + 5 ?",
      "choices": ["12", "13", "14"],
      "correctIndex": 1,
      "correctFeedback": "Parfait !",
      "wrongFeedback": "Compte bien…"
    },
    { "position": 2, "type": "bonus", "bonusSpaces": 2, "narrative": "Case bonus ! Avance de 2 !" },
    { "position": 3, "type": "repos", "narrative": "Pause bien méritée." }
  ],
  "endNarrative": "Tu as traversé la jungle !"
}`,
  cartes: `{
  "title": "Duel Magique",
  "narrative": "Un dragon menace le royaume !",
  "setting": "château",
  "playerName": "Héros",
  "playerEmoji": "🧙",
  "enemyName": "Dragon",
  "enemyEmoji": "🐉",
  "playerMaxHP": 100,
  "enemyMaxHP": 100,
  "cards": [
    {
      "id": "c1",
      "name": "Boule de feu",
      "emoji": "🔥",
      "type": "attack",
      "question": "Combien font 7 × 8 ?",
      "choices": ["54", "56", "58"],
      "correctIndex": 1,
      "power": 25,
      "description": "Inflige des dégâts de feu",
      "wrongPenalty": 10
    }
  ]
}`,
  defi: `{
  "title": "Défi Express",
  "emoji": "⚡",
  "narrative": "Prêt pour le grand défi ?",
  "totalTimeSeconds": 90,
  "challenges": [
    {
      "question": "Quelle est la capitale de la France ?",
      "choices": ["Londres", "Paris", "Berlin", "Madrid"],
      "correctIndex": 1,
      "points": 10,
      "timeBonusSeconds": 5
    }
  ]
}`,
  construction: `{
  "title": "Construis ta Fusée",
  "narrative": "Réponds aux questions pour assembler ta fusée !",
  "buildTarget": "Fusée Spatiale",
  "buildEmoji": "🚀",
  "pieces": [
    {
      "id": "p1",
      "name": "Moteur",
      "emoji": "🔩",
      "question": "Quelle planète est la plus grande ?",
      "choices": ["Terre", "Jupiter", "Saturne"],
      "correctIndex": 1,
      "hint": "C'est la plus grande planète du système solaire.",
      "unlockText": "Le moteur est assemblé !"
    }
  ],
  "completionText": "Ta fusée est prête pour le décollage !"
}`,
};

function JsonEditor({
  type,
  value,
  onChange,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [showExample, setShowExample] = useState(false);
  let parsed: unknown = null;
  let parseError = "";
  try {
    if (value.trim()) parsed = JSON.parse(value);
  } catch (e) {
    parseError = e instanceof Error ? e.message : "JSON invalide";
  }

  const icons: Record<string, string> = {
    quete: "🧭", aventure: "📖", mission: "🎯", plateau: "🎲",
    cartes: "🃏", defi: "⚡", construction: "🔧",
  };
  const countKey: Record<string, string> = {
    quete: "rooms", aventure: "chapters", mission: "phases", plateau: "spaces",
    cartes: "cards", defi: "challenges", construction: "pieces",
  };

  const countItems =
    parsed && typeof parsed === "object" && parsed !== null
      ? ((parsed as Record<string, unknown>)[countKey[type]] as unknown[] | undefined)?.length ?? null
      : null;

  return (
    <div
      className="bg-white rounded-[20px] p-6 mb-6"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icons[type]}</span>
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">Configuration JSON</p>
          <p className="text-xs text-[#94A3B8]">
            Demande la config à Claude dans le chat, puis colle-la ici.
          </p>
        </div>
      </div>

      {/* Example toggle */}
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={() => setShowExample((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-[#2563EB] font-medium hover:underline"
        >
          {showExample ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showExample ? "Masquer" : "Voir"} le format attendu
        </button>
        {!value.trim() && (
          <button
            type="button"
            onClick={() => onChange(JSON_EXAMPLES[type] ?? "")}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg text-white"
            style={{ background: "#2563EB" }}
          >
            Utiliser l&apos;exemple →
          </button>
        )}
      </div>

      {showExample && (
        <pre
          className="text-[11px] text-[#475569] bg-[#F8FAFC] rounded-xl p-4 overflow-x-auto mb-4 leading-relaxed"
          style={{ border: "1px solid #F1F5F9" }}
        >
          {JSON_EXAMPLES[type]}
        </pre>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Colle ici le JSON généré pour ton ${type}…`}
        rows={10}
        spellCheck={false}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[12px] font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-y"
      />

      {/* Validation feedback */}
      {value.trim() && (
        <div
          className="mt-2 px-3 py-2 rounded-xl text-xs font-medium"
          style={{
            background: parseError ? "#FEF2F2" : "#ECFDF5",
            color: parseError ? "#DC2626" : "#059669",
          }}
        >
          {parseError
            ? `❌ JSON invalide : ${parseError}`
            : countItems !== null
            ? `✅ JSON valide — ${countItems} ${countKey[type]} détecté${countItems !== 1 ? "s" : ""}`
            : "✅ JSON valide"}
        </div>
      )}
    </div>
  );
}

export default function GameForm({ error }: { error?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [gameType, setGameType] = useState("image-click");

  // image-click state
  const [rounds, setRounds] = useState<Round[]>([EMPTY_ROUND()]);

  // memory state
  const [pairs, setPairs] = useState<MemoryPair[]>([EMPTY_PAIR(), EMPTY_PAIR()]);

  // quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([EMPTY_QUESTION()]);
  const [timePerQuestion, setTimePerQuestion] = useState(20);

  // anagram state
  const [anagramWords, setAnagramWords] = useState<AnagramWord[]>([EMPTY_WORD()]);

  // escape state
  const [escapeScenario, setEscapeScenario] = useState("");
  const [escapeSetting, setEscapeSetting] = useState("🏰");
  const [escapeQuestions, setEscapeQuestions] = useState<EscapeQuestion[]>([EMPTY_ESCAPE_Q()]);

  // enquete state
  const [enqueteIntro, setEnqueteIntro] = useState("");
  const [enqueteMystery, setEnqueteMystery] = useState("");
  const [enqueteSetting, setEnqueteSetting] = useState("🔎");
  const [enqueteResolution, setEnqueteResolution] = useState("");
  const [enqueteQuestions, setEnqueteQuestions] = useState<EnqueteQuestion[]>([EMPTY_ENQUETE_Q()]);

  // title state
  const [title, setTitle] = useState("");

  // complex types JSON state
  const [complexJson, setComplexJson] = useState<Record<string, string>>({
    quete: "", aventure: "", mission: "", plateau: "", cartes: "", defi: "", construction: "",
  });

  function setJsonForType(type: string, value: string) {
    setComplexJson((prev) => ({ ...prev, [type]: value }));
  }

  function getConfig() {
    if (gameType === "image-click") return JSON.stringify({ rounds });
    if (gameType === "memory") return JSON.stringify({ pairs });
    if (gameType === "quiz") return JSON.stringify({ timePerQuestion, questions });
    if (gameType === "anagram") return JSON.stringify({ words: anagramWords });
    if (gameType === "escape") return JSON.stringify({ scenario: escapeScenario, setting: escapeSetting, questions: escapeQuestions });
    if (gameType === "enquete") return JSON.stringify({ intro: enqueteIntro, mystery: enqueteMystery, setting: enqueteSetting, resolution: enqueteResolution, questions: enqueteQuestions });
    if (COMPLEX_TYPES.includes(gameType)) {
      const raw = complexJson[gameType] ?? "";
      try { JSON.parse(raw); return raw; } catch { return "{}"; }
    }
    return "{}";
  }

  // ── image-click helpers ──────────────────────────────────────────
  function updateRound(ri: number, field: string, value: string) {
    setRounds((prev) => prev.map((r, i) => (i === ri ? { ...r, [field]: value } : r)));
  }
  function updateChoice(ri: number, ci: number, field: keyof Choice, value: string | boolean) {
    setRounds((prev) =>
      prev.map((r, i) => {
        if (i !== ri) return r;
        return {
          ...r,
          choices: r.choices.map((c, j) =>
            field === "isCorrect" ? { ...c, isCorrect: j === ci } : j === ci ? { ...c, [field]: value } : c
          ),
        };
      })
    );
  }

  // ── memory helpers ───────────────────────────────────────────────
  function updatePair(pi: number, field: keyof MemoryPair, value: string) {
    setPairs((prev) => prev.map((p, i) => (i === pi ? { ...p, [field]: value } : p)));
  }

  // ── quiz helpers ─────────────────────────────────────────────────
  function updateQuestion(qi: number, field: keyof QuizQuestion, value: string | number) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, [field]: value } : q)));
  }
  function updateQuizChoice(qi: number, ci: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, choices: q.choices.map((c, j) => (j === ci ? value : c)) } : q
      )
    );
  }

  // ── anagram helpers ──────────────────────────────────────────────
  function updateAnagramWord(wi: number, field: keyof AnagramWord, value: string) {
    setAnagramWords((prev) => prev.map((w, i) => (i === wi ? { ...w, [field]: value } : w)));
  }

  // ── escape helpers ────────────────────────────────────────────────
  function updateEscapeQ(qi: number, field: keyof EscapeQuestion, value: string | number) {
    setEscapeQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, [field]: value } : q)));
  }
  function updateEscapeChoice(qi: number, ci: number, value: string) {
    setEscapeQuestions((prev) =>
      prev.map((q, i) => i === qi ? { ...q, choices: q.choices.map((c, j) => (j === ci ? value : c)) } : q)
    );
  }

  // ── enquete helpers ───────────────────────────────────────────────
  function updateEnqueteQ(qi: number, field: keyof EnqueteQuestion, value: string | number) {
    setEnqueteQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, [field]: value } : q)));
  }
  function updateEnqueteChoice(qi: number, ci: number, value: string) {
    setEnqueteQuestions((prev) =>
      prev.map((q, i) => i === qi ? { ...q, choices: q.choices.map((c, j) => (j === ci ? value : c)) } : q)
    );
  }

  return (
    <form ref={formRef} action={createGame}>
      <input type="hidden" name="gameType" value={gameType} />
      <input type="hidden" name="config" value={getConfig()} />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl mb-6 text-center">
          {decodeURIComponent(error)}
        </div>
      )}

      {/* Title */}
      <div
        className="bg-white rounded-[20px] p-6 mb-6"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
      >
        <label className="text-sm font-semibold mb-2 block text-[#0F172A]">Titre du jeu</label>
        <input
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex : Les animaux, Les fractions, La Révolution française…"
          className="w-full h-12 border border-gray-200 rounded-[12px] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
        />
      </div>

      {/* Game type selector */}
      <div
        className="bg-white rounded-[20px] p-6 mb-6"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
      >
        <label className="text-sm font-semibold mb-3 block text-[#0F172A]">Type de jeu</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GAME_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setGameType(t.value)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                gameType === t.value
                  ? "border-[#2563EB] bg-[#2563EB]/5"
                  : "border-gray-200 hover:border-[#2563EB]/40"
              }`}
            >
              <div className="font-semibold text-sm text-[#0F172A]">{t.label}</div>
              <div className="text-xs text-[#475569] mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Complex types: JSON editor ── */}
      {COMPLEX_TYPES.includes(gameType) && (
        <JsonEditor
          type={gameType}
          value={complexJson[gameType] ?? ""}
          onChange={(v) => setJsonForType(gameType, v)}
        />
      )}

      {/* ── image-click editor ── */}
      {gameType === "image-click" && (
        <div className="flex flex-col gap-6 mb-6">
          {rounds.map((round, ri) => (
            <div key={ri} className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Round {ri + 1}</h3>
                {rounds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRounds((prev) => prev.filter((_, i) => i !== ri))}
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <div className="mb-4">
                <label className="text-xs font-medium text-[#475569] mb-1.5 block">
                  Instruction (ex : &quot;Clique sur le CHAT&quot;)
                </label>
                <input
                  type="text"
                  required
                  value={round.instruction}
                  onChange={(e) => updateRound(ri, "instruction", e.target.value)}
                  placeholder="Clique sur le..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {round.choices.map((choice, ci) => (
                  <div
                    key={ci}
                    className={`border-2 rounded-xl p-3 transition-colors ${
                      choice.isCorrect ? "border-green-500 bg-green-50" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name={`correct-${ri}`}
                        checked={choice.isCorrect}
                        onChange={() => updateChoice(ri, ci, "isCorrect", true)}
                        className="accent-green-500"
                      />
                      <span className="text-xs text-muted-foreground">
                        {choice.isCorrect ? "✅ Correct" : "Incorrecte"}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={choice.emoji}
                      onChange={(e) => updateChoice(ri, ci, "emoji", e.target.value)}
                      placeholder="🐱"
                      className="w-full text-2xl text-center border border-input rounded-lg py-1 mb-2 focus:outline-none focus:ring-1 focus:ring-ring"
                      maxLength={2}
                    />
                    <input
                      type="text"
                      value={choice.label}
                      onChange={(e) => updateChoice(ri, ci, "label", e.target.value)}
                      placeholder="Label"
                      className="w-full border border-input rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setRounds((prev) => [...prev, EMPTY_ROUND()])}
          >
            + Ajouter un round
          </Button>
        </div>
      )}

      {/* ── memory editor ── */}
      {gameType === "memory" && (
        <div className="bg-white rounded-[20px] p-6 mb-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
          <p className="text-xs text-[#475569] mb-4">
            Crée des paires emoji ↔ mot. Les cartes seront mélangées automatiquement.
          </p>
          <div className="flex flex-col gap-3 mb-4">
            {pairs.map((pair, pi) => (
              <div key={pi} className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-6">{pi + 1}.</span>
                <input
                  type="text"
                  value={pair.emoji}
                  onChange={(e) => updatePair(pi, "emoji", e.target.value)}
                  placeholder="🐱"
                  maxLength={2}
                  className="w-14 text-center text-2xl border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
                <input
                  type="text"
                  value={pair.word}
                  onChange={(e) => updatePair(pi, "word", e.target.value)}
                  placeholder="Chat"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
                {pairs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPairs((prev) => prev.filter((_, i) => i !== pi))}
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPairs((prev) => [...prev, EMPTY_PAIR()])}
            className="w-full"
          >
            + Ajouter une paire
          </Button>
        </div>
      )}

      {/* ── quiz editor ── */}
      {gameType === "quiz" && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <label className="text-sm font-semibold mb-2 block text-[#0F172A]">
              Temps par question (secondes)
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(Number(e.target.value))}
              className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            />
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Question {qi + 1}</h3>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(qi, "question", e.target.value)}
                placeholder="Quelle est la capitale de la France ?"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent mb-4"
              />
              <div className="flex flex-col gap-2">
                {q.choices.map((choice, ci) => (
                  <div key={ci} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`quiz-correct-${qi}`}
                      checked={q.correctIndex === ci}
                      onChange={() => updateQuestion(qi, "correctIndex", ci)}
                      className="accent-green-500 shrink-0"
                    />
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => updateQuizChoice(qi, ci, e.target.value)}
                      placeholder={`Choix ${String.fromCharCode(65 + ci)}`}
                      className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent ${
                        q.correctIndex === ci ? "border-green-500 bg-green-50" : "border-gray-200"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setQuestions((prev) => [...prev, EMPTY_QUESTION()])}
          >
            + Ajouter une question
          </Button>
        </div>
      )}

      {/* ── anagram editor ── */}
      {gameType === "anagram" && (
        <div className="bg-white rounded-[20px] p-6 mb-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
          <p className="text-xs text-[#475569] mb-4">
            Les lettres de chaque mot seront mélangées. L&apos;élève doit les remettre dans l&apos;ordre.
          </p>
          <div className="flex flex-col gap-4">
            {anagramWords.map((w, wi) => (
              <div key={wi} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Mot {wi + 1}</span>
                  {anagramWords.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setAnagramWords((prev) => prev.filter((_, i) => i !== wi))}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={w.emoji}
                    onChange={(e) => updateAnagramWord(wi, "emoji", e.target.value)}
                    placeholder="🐱"
                    maxLength={2}
                    className="w-14 text-center text-2xl border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={w.word}
                      onChange={(e) => updateAnagramWord(wi, "word", e.target.value)}
                      placeholder="CHAT"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={w.hint}
                      onChange={(e) => updateAnagramWord(wi, "hint", e.target.value)}
                      placeholder="Indice : Un animal qui miaule"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAnagramWords((prev) => [...prev, EMPTY_WORD()])}
            className="w-full mt-4"
          >
            + Ajouter un mot
          </Button>
        </div>
      )}

      {/* ── escape editor ── */}
      {gameType === "escape" && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <p className="text-xs text-[#475569] mb-4">Les élèves doivent résoudre des énigmes pour assembler un code secret chiffre par chiffre.</p>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Emoji / décor</label>
                <input type="text" value={escapeSetting} onChange={(e) => setEscapeSetting(e.target.value)} maxLength={2}
                  className="w-16 text-center text-2xl border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
              </div>
            </div>
            <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Scénario d&apos;introduction</label>
            <textarea value={escapeScenario} onChange={(e) => setEscapeScenario(e.target.value)}
              placeholder="Ex: Le château est verrouillé depuis des siècles. Résous les énigmes pour trouver la combinaison…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none" />
          </div>

          {escapeQuestions.map((q, qi) => (
            <div key={qi} className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-[#0F172A]">Énigme {qi + 1}</h3>
                {escapeQuestions.length > 1 && (
                  <button type="button" onClick={() => setEscapeQuestions((prev) => prev.filter((_, i) => i !== qi))}
                    className="text-xs text-red-500 hover:text-red-700">Supprimer</button>
                )}
              </div>
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-[#475569] mb-1.5 block">Question / Énigme</label>
                  <input type="text" value={q.question} onChange={(e) => updateEscapeQ(qi, "question", e.target.value)}
                    placeholder="Ex: Combien font 7 × 8 ?"
                    className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium text-[#475569] mb-1.5 block">Chiffre du code</label>
                  <input type="text" value={q.codeDigit} onChange={(e) => updateEscapeQ(qi, "codeDigit", e.target.value)}
                    placeholder="5" maxLength={1}
                    className="w-full h-10 border border-gray-200 rounded-xl px-3 text-center font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                </div>
              </div>
              <div className="flex flex-col gap-2 mb-3">
                {q.choices.map((choice, ci) => (
                  <div key={ci} className="flex items-center gap-3">
                    <input type="radio" name={`escape-correct-${qi}`} checked={q.correctIndex === ci}
                      onChange={() => updateEscapeQ(qi, "correctIndex", ci)} className="accent-[#2563EB] shrink-0" />
                    <input type="text" value={choice} onChange={(e) => updateEscapeChoice(qi, ci, e.target.value)}
                      placeholder={`Réponse ${String.fromCharCode(65 + ci)}`}
                      className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent ${q.correctIndex === ci ? "border-green-500 bg-green-50" : "border-gray-200"}`} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-[#475569] mb-1.5 block">Indice en cas d&apos;erreur (optionnel)</label>
                <input type="text" value={q.wrongHint} onChange={(e) => updateEscapeQ(qi, "wrongHint", e.target.value)}
                  placeholder="Ex: Compte par groupes de 7…"
                  className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setEscapeQuestions((prev) => [...prev, EMPTY_ESCAPE_Q()])}>
            + Ajouter une énigme
          </Button>
        </div>
      )}

      {/* ── enquete editor ── */}
      {gameType === "enquete" && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <p className="text-xs text-[#475569] mb-4">Les élèves collectent des indices en répondant correctement pour résoudre un mystère final.</p>
            <div className="flex gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Emoji décor</label>
                <input type="text" value={enqueteSetting} onChange={(e) => setEnqueteSetting(e.target.value)} maxLength={2}
                  className="w-16 text-center text-2xl border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Le mystère à résoudre</label>
                <input type="text" value={enqueteMystery} onChange={(e) => setEnqueteMystery(e.target.value)}
                  placeholder="Ex: Qui a volé le trésor du roi ?"
                  className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Introduction / contexte</label>
              <textarea value={enqueteIntro} onChange={(e) => setEnqueteIntro(e.target.value)}
                placeholder="Ex: Un vol mystérieux a eu lieu au château. Tu es détective junior…"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Résolution finale</label>
              <textarea value={enqueteResolution} onChange={(e) => setEnqueteResolution(e.target.value)}
                placeholder="Ex: Grâce à tes indices, tu as découvert que c'était le chambellan…"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none" />
            </div>
          </div>

          {enqueteQuestions.map((q, qi) => (
            <div key={qi} className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-[#0F172A]">Question {qi + 1}</h3>
                {enqueteQuestions.length > 1 && (
                  <button type="button" onClick={() => setEnqueteQuestions((prev) => prev.filter((_, i) => i !== qi))}
                    className="text-xs text-red-500 hover:text-red-700">Supprimer</button>
                )}
              </div>
              <input type="text" value={q.question} onChange={(e) => updateEnqueteQ(qi, "question", e.target.value)}
                placeholder="Ex: Quelle est la couleur du manteau du roi ?"
                className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent mb-3" />
              <div className="flex flex-col gap-2 mb-3">
                {q.choices.map((choice, ci) => (
                  <div key={ci} className="flex items-center gap-3">
                    <input type="radio" name={`enquete-correct-${qi}`} checked={q.correctIndex === ci}
                      onChange={() => updateEnqueteQ(qi, "correctIndex", ci)} className="accent-[#2563EB] shrink-0" />
                    <input type="text" value={choice} onChange={(e) => updateEnqueteChoice(qi, ci, e.target.value)}
                      placeholder={`Réponse ${String.fromCharCode(65 + ci)}`}
                      className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent ${q.correctIndex === ci ? "border-green-500 bg-green-50" : "border-gray-200"}`} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="w-12">
                  <label className="text-xs font-medium text-[#475569] mb-1.5 block">Emoji</label>
                  <input type="text" value={q.clueEmoji} onChange={(e) => updateEnqueteQ(qi, "clueEmoji", e.target.value)}
                    maxLength={2}
                    className="w-full text-center text-xl border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-[#475569] mb-1.5 block">Indice révélé si bonne réponse</label>
                  <input type="text" value={q.clue} onChange={(e) => updateEnqueteQ(qi, "clue", e.target.value)}
                    placeholder="Ex: Le manteau rouge a été retrouvé près de la cave…"
                    className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setEnqueteQuestions((prev) => [...prev, EMPTY_ENQUETE_Q()])}>
            + Ajouter une question
          </Button>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          Enregistrer le jeu 💾
        </Button>
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full mt-3 text-sm text-[#475569] hover:text-[#0F172A] transition-colors"
      >
        Annuler
      </button>
    </form>
  );
}
