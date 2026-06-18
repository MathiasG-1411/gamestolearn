"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

// ── game type descriptions ───────────────────────────────────────────
const GAME_TYPES = [
  { value: "image-click", label: "🎯 Clique sur la bonne image", desc: "4 choix avec emoji, un seul correct" },
  { value: "memory", label: "🧠 Memory", desc: "Associe les paires emoji ↔ mot" },
  { value: "quiz", label: "⏱️ Quiz chronométré", desc: "QCM avec minuterie par question" },
  { value: "anagram", label: "🔤 Anagramme", desc: "Remets les lettres dans l'ordre" },
];

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

  function getConfig() {
    if (gameType === "image-click") return JSON.stringify({ rounds });
    if (gameType === "memory") return JSON.stringify({ pairs });
    if (gameType === "quiz") return JSON.stringify({ timePerQuestion, questions });
    if (gameType === "anagram") return JSON.stringify({ words: anagramWords });
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
