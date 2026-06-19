"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createGame } from "./actions";
import { generateGameWithAI } from "./ai-generator-action";

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

// ── escape game types ────────────────────────────────────────────────
type EscapeQuestion = { question: string; choices: string[]; correctIndex: number; codeDigit: string; wrongHint: string };
const EMPTY_ESCAPE_Q = (): EscapeQuestion => ({
  question: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
  codeDigit: "",
  wrongHint: "",
});

// ── enquete types ────────────────────────────────────────────────────
type EnqueteQuestion = { question: string; choices: string[]; correctIndex: number; clue: string; clueEmoji: string; wrongHint: string };
const EMPTY_ENQUETE_Q = (): EnqueteQuestion => ({
  question: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
  clue: "",
  clueEmoji: "",
  wrongHint: "",
});

// ── game type descriptions ───────────────────────────────────────────
const GAME_TYPES = [
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

const AI_GRADES = ["CP", "CE1", "CE2", "CM1", "CM2", "6ème", "5ème", "4ème", "3ème"];
const AI_SUPPORTED = ["escape", "aventure", "mission", "plateau", "cartes", "defi", "construction", "quiz", "memory", "anagram"];

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

  // title state (controlled for AI autofill)
  const [title, setTitle] = useState("");

  // AI generator state
  const [aiSubject, setAiSubject] = useState("");
  const [aiGrade, setAiGrade] = useState("CM2");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aventureConfig, setAventureConfig] = useState<Record<string, unknown> | null>(null);
  const [missionConfig, setMissionConfig] = useState<Record<string, unknown> | null>(null);
  const [plateauConfig, setPlateauConfig] = useState<Record<string, unknown> | null>(null);
  const [cartesConfig, setCartesConfig] = useState<Record<string, unknown> | null>(null);
  const [defiConfig, setDefiConfig] = useState<Record<string, unknown> | null>(null);
  const [constructionConfig, setConstructionConfig] = useState<Record<string, unknown> | null>(null);

  async function handleAIGenerate() {
    if (!aiSubject.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateGameWithAI(gameType, aiSubject, aiGrade);
      if (!result.success || !result.config) {
        setAiError(result.error ?? "Erreur inconnue");
        return;
      }
      const parsed = JSON.parse(result.config) as Record<string, unknown>;
      if (result.title) setTitle(result.title);
      if (gameType === "aventure") {
        setAventureConfig(parsed);
      } else if (gameType === "mission") {
        setMissionConfig(parsed);
      } else if (gameType === "plateau") {
        setPlateauConfig(parsed);
      } else if (gameType === "cartes") {
        setCartesConfig(parsed);
      } else if (gameType === "defi") {
        setDefiConfig(parsed);
      } else if (gameType === "construction") {
        setConstructionConfig(parsed);
      } else if (gameType === "escape") {
        if (parsed.scenario) setEscapeScenario(parsed.scenario as string);
        if (parsed.setting) setEscapeSetting(parsed.setting as string);
        if (parsed.questions) setEscapeQuestions(parsed.questions as EscapeQuestion[]);
      } else if (gameType === "quiz") {
        if (parsed.timePerQuestion) setTimePerQuestion(parsed.timePerQuestion as number);
        if (parsed.questions) setQuestions(parsed.questions as QuizQuestion[]);
      } else if (gameType === "memory") {
        if (parsed.pairs) {
          setPairs((parsed.pairs as { word: string; emoji: string }[]).map((p) => ({ ...p, id: crypto.randomUUID() })));
        }
      } else if (gameType === "anagram") {
        if (parsed.words) setAnagramWords(parsed.words as AnagramWord[]);
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAiLoading(false);
    }
  }

  function getConfig() {
    if (gameType === "image-click") return JSON.stringify({ rounds });
    if (gameType === "memory") return JSON.stringify({ pairs });
    if (gameType === "quiz") return JSON.stringify({ timePerQuestion, questions });
    if (gameType === "anagram") return JSON.stringify({ words: anagramWords });
    if (gameType === "escape") return JSON.stringify({ scenario: escapeScenario, setting: escapeSetting, questions: escapeQuestions });
    if (gameType === "enquete") return JSON.stringify({ intro: enqueteIntro, mystery: enqueteMystery, setting: enqueteSetting, resolution: enqueteResolution, questions: enqueteQuestions });
    if (gameType === "aventure") return aventureConfig ? JSON.stringify(aventureConfig) : "{}";
    if (gameType === "mission") return missionConfig ? JSON.stringify(missionConfig) : "{}";
    if (gameType === "plateau") return plateauConfig ? JSON.stringify(plateauConfig) : "{}";
    if (gameType === "cartes") return cartesConfig ? JSON.stringify(cartesConfig) : "{}";
    if (gameType === "defi") return defiConfig ? JSON.stringify(defiConfig) : "{}";
    if (gameType === "construction") return constructionConfig ? JSON.stringify(constructionConfig) : "{}";
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
          placeholder="ex : Les animaux, Les couleurs, L'alphabet..."
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

      {/* ── AI generator ── */}
      {AI_SUPPORTED.includes(gameType) && (
        <div
          className="bg-white rounded-[20px] p-6 mb-6"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(124,58,237,0.12)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">Générer avec l&apos;IA</p>
              <p className="text-xs text-[#94A3B8]">Décris le sujet et laisse Claude créer tout le jeu</p>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={aiSubject}
              onChange={(e) => setAiSubject(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAIGenerate(); } }}
              placeholder="ex : Les fractions, La photosynthèse, La Révolution française…"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
            />
            <select
              value={aiGrade}
              onChange={(e) => setAiGrade(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent bg-white"
            >
              {AI_GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          {aiError && (
            <p className="text-xs text-red-500 mb-3 px-1">{aiError}</p>
          )}
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={aiLoading || !aiSubject.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)" }}
          >
            {aiLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Générer le jeu avec l&apos;IA
              </>
            )}
          </button>
          {gameType === "aventure" && aventureConfig && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex items-center gap-2">
              <span>✅</span>
              <span>Aventure générée — {(aventureConfig.chapters as unknown[])?.length ?? 0} chapitres</span>
            </div>
          )}
          {gameType === "mission" && missionConfig && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex items-center gap-2">
              <span>✅</span>
              <span>Mission générée — {(missionConfig.phases as unknown[])?.length ?? 0} phases + boss</span>
            </div>
          )}
          {gameType === "plateau" && plateauConfig && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex items-center gap-2">
              <span>✅</span>
              <span>Plateau généré — {(plateauConfig.spaces as unknown[])?.length ?? 0} cases</span>
            </div>
          )}
          {gameType === "cartes" && cartesConfig && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex items-center gap-2">
              <span>✅</span>
              <span>Jeu de cartes généré — {(cartesConfig.cards as unknown[])?.length ?? 0} cartes</span>
            </div>
          )}
          {gameType === "defi" && defiConfig && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex items-center gap-2">
              <span>✅</span>
              <span>Défi généré — {(defiConfig.challenges as unknown[])?.length ?? 0} défis · {String(defiConfig.totalTimeSeconds ?? 90)}s</span>
            </div>
          )}
          {gameType === "construction" && constructionConfig && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex items-center gap-2">
              <span>✅</span>
              <span>Construction générée — {(constructionConfig.pieces as unknown[])?.length ?? 0} pièces</span>
            </div>
          )}
        </div>
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
                        q.correctIndex === ci
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
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
              placeholder="Ex: Le château est verrouillé depuis des siècles. Résous les énigmes pour trouver la combinaison du portail..."
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
                  placeholder="Ex: Compte par groupes de 7..."
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
                placeholder="Ex: Un vol mystérieux a eu lieu au château. Tu es détective junior et tu dois trouver le coupable..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Résolution finale</label>
              <textarea value={enqueteResolution} onChange={(e) => setEnqueteResolution(e.target.value)}
                placeholder="Ex: Grâce à tes indices, tu as découvert que c'était le chambellan qui avait volé le trésor pour ..."
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
                    placeholder="Ex: Le manteau rouge a été retrouvé près de la cave..."
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

      {/* ── aventure editor ── */}
      {gameType === "aventure" && (
        <div
          className="bg-white rounded-[20px] p-6 mb-6"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          {!aventureConfig ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">📖</div>
              <p className="text-sm font-semibold text-[#0F172A] mb-1">Jeu d&apos;aventure interactif</p>
              <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
                Utilisez le générateur IA ci-dessus pour créer un livre dont vous êtes le héros avec narration, défis et choix multiples.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#0F172A]">Chapitres générés</p>
                <button
                  type="button"
                  onClick={() => setAventureConfig(null)}
                  className="text-xs text-[#94A3B8] hover:text-red-500 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
              <div className="space-y-1.5">
                {(aventureConfig.chapters as Array<{ id: string; narrative: string }>)?.map((ch) => (
                  <div key={ch.id} className="flex items-start gap-2 bg-[#F8FAFC] rounded-xl px-3 py-2">
                    <span className="font-mono text-[10px] text-[#94A3B8] shrink-0 mt-0.5 uppercase">{ch.id}</span>
                    <span className="text-[12px] text-[#475569] line-clamp-1">{ch.narrative}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── mission editor ── */}
      {gameType === "mission" && (
        <div
          className="bg-white rounded-[20px] p-6 mb-6"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          {!missionConfig ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-sm font-semibold text-[#0F172A] mb-1">Mission pédagogique</p>
              <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
                Utilisez le générateur IA ci-dessus pour créer une mission multi-phases avec briefing, phases de quiz et boss final.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#0F172A]">Structure de la mission</p>
                <button
                  type="button"
                  onClick={() => setMissionConfig(null)}
                  className="text-xs text-[#94A3B8] hover:text-red-500 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
              <div className="space-y-1.5">
                {(missionConfig.phases as Array<{ title: string; questions: unknown[] }>)?.map((ph, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2">
                    <span className="text-[12px] text-[#0F172A] font-medium">{ph.title}</span>
                    <span className="text-[11px] text-[#94A3B8]">{ph.questions?.length ?? 0} questions</span>
                  </div>
                ))}
                {!!missionConfig.bossChallenge && (
                  <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <span className="text-[12px] text-red-700 font-medium">⚔️ Boss final</span>
                    <span className="text-[11px] text-red-500">1 défi</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── plateau editor ── */}
      {gameType === "plateau" && (
        <div className="bg-white rounded-[20px] p-6 mb-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
          {!plateauConfig ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎲</div>
              <p className="text-sm font-semibold text-[#0F172A] mb-1">Jeu de plateau</p>
              <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">Utilisez le générateur IA ci-dessus pour créer un parcours avec cases questions, bonus et pièges.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#0F172A]">{(plateauConfig.spaces as unknown[])?.length ?? 0} cases générées</p>
                <button type="button" onClick={() => setPlateauConfig(null)} className="text-xs text-[#94A3B8] hover:text-red-500 transition-colors">Réinitialiser</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(plateauConfig.spaces as Array<{ type: string; position: number }>)?.map((s, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: s.type === "bonus" ? "#f0fdf4" : s.type === "malus" ? "#fef2f2" : s.type === "repos" ? "#fefce8" : "#EFF6FF", color: s.type === "bonus" ? "#16a34a" : s.type === "malus" ? "#dc2626" : s.type === "repos" ? "#d97706" : "#2563EB" }}>
                    {s.type === "bonus" ? "⭐" : s.type === "malus" ? "💀" : s.type === "repos" ? "🏕️" : s.position}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── cartes editor ── */}
      {gameType === "cartes" && (
        <div className="bg-white rounded-[20px] p-6 mb-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
          {!cartesConfig ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🃏</div>
              <p className="text-sm font-semibold text-[#0F172A] mb-1">Jeu de cartes RPG</p>
              <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">Utilisez le générateur IA pour créer un duel où l&apos;élève active des cartes en répondant aux questions.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#0F172A]">{String(cartesConfig.playerEmoji ?? "")} vs {String(cartesConfig.enemyEmoji ?? "")} · {(cartesConfig.cards as unknown[])?.length ?? 0} cartes</p>
                <button type="button" onClick={() => setCartesConfig(null)} className="text-xs text-[#94A3B8] hover:text-red-500 transition-colors">Réinitialiser</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(cartesConfig.cards as Array<{ name: string; emoji: string; type: string }>)?.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-[#F8FAFC] rounded-xl px-3 py-1.5">
                    <span>{c.emoji}</span>
                    <span className="text-[11px] text-[#475569] font-medium">{c.name}</span>
                    <span className="text-[10px]" style={{ color: c.type === "attack" ? "#dc2626" : c.type === "defense" ? "#2563EB" : "#7C3AED" }}>
                      {c.type === "attack" ? "⚔️" : c.type === "defense" ? "🛡️" : "✨"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── defi editor ── */}
      {gameType === "defi" && (
        <div className="bg-white rounded-[20px] p-6 mb-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
          {!defiConfig ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">⚡</div>
              <p className="text-sm font-semibold text-[#0F172A] mb-1">Défi chronométré</p>
              <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">L&apos;IA génère une série de défis rapides avec une barre de temps qui descend et des bonus si tu réponds vite.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#0F172A]">{(defiConfig.challenges as unknown[])?.length ?? 0} défis · {String(defiConfig.totalTimeSeconds ?? 90)}s</p>
                <button type="button" onClick={() => setDefiConfig(null)} className="text-xs text-[#94A3B8] hover:text-red-500 transition-colors">Réinitialiser</button>
              </div>
              <div className="space-y-1">
                {(defiConfig.challenges as Array<{ question: string; points: number }>)?.map((ch, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2">
                    <span className="text-[12px] text-[#475569] line-clamp-1 flex-1">{ch.question}</span>
                    <span className="text-[11px] text-[#94A3B8] ml-2 shrink-0">{ch.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── construction editor ── */}
      {gameType === "construction" && (
        <div className="bg-white rounded-[20px] p-6 mb-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
          {!constructionConfig ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🔧</div>
              <p className="text-sm font-semibold text-[#0F172A] mb-1">Construction progressive</p>
              <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">Chaque bonne réponse débloque une pièce. L&apos;élève construit quelque chose au fil du jeu.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#0F172A]">{String(constructionConfig.buildEmoji ?? "")} {String(constructionConfig.buildTarget ?? "")} · {(constructionConfig.pieces as unknown[])?.length ?? 0} pièces</p>
                <button type="button" onClick={() => setConstructionConfig(null)} className="text-xs text-[#94A3B8] hover:text-red-500 transition-colors">Réinitialiser</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(constructionConfig.pieces as Array<{ name: string; emoji: string }>)?.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-[#F8FAFC] rounded-xl px-3 py-1.5">
                    <span>{p.emoji}</span>
                    <span className="text-[11px] text-[#475569]">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
