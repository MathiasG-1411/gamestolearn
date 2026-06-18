"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveScore } from "../actions";

type EnqueteQuestion = {
  question: string;
  choices: string[];
  correctIndex: number;
  clue: string;
  clueEmoji: string;
  wrongHint?: string;
};

type EnqueteConfig = {
  intro: string;
  mystery: string;
  setting: string;
  questions: EnqueteQuestion[];
  resolution: string;
};

type Phase = "intro" | "question" | "clue-reveal" | "wrong-feedback" | "end";

export default function EnqueteGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const router = useRouter();
  const { intro, mystery, setting, questions, resolution } =
    game.config as EnqueteConfig;

  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [collectedClues, setCollectedClues] = useState<EnqueteQuestion[]>([]);
  const [score, setScore] = useState(0);

  const question = questions[current];

  function handleChoice(i: number) {
    if (selected !== null) return;
    const correct = i === question.correctIndex;
    setSelected(i);

    if (correct) {
      setCollectedClues((c) => [...c, question]);
      setScore((s) => s + 1);
      setPhase("clue-reveal");
    } else {
      setPhase("wrong-feedback");
      setTimeout(() => {
        setSelected(null);
        setPhase("question");
      }, 2000);
    }
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) {
      saveScore(studentId, game.id, score + 1).then(() => setPhase("end"));
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setPhase("question");
    }
  }

  // ── INTRO ──────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0F172A]">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-7xl mb-4">{setting}</div>
            <h1 className="text-3xl font-bold text-white mb-2">{game.title}</h1>
            <div className="inline-block bg-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              🔎 Enquête
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <p className="text-sm font-semibold text-amber-400 mb-2">Le mystère :</p>
            <p className="text-white font-bold text-lg mb-4">{mystery}</p>
            <p className="text-white/70 text-sm leading-relaxed">{intro}</p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="text-2xl">🗂️</div>
            <div>
              <p className="text-white text-sm font-semibold">
                {questions.length} indice{questions.length > 1 ? "s" : ""} à collecter
              </p>
              <p className="text-white/50 text-xs">Réponds correctement pour révéler chaque indice</p>
            </div>
          </div>

          <Button
            onClick={() => setPhase("question")}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-12 rounded-2xl text-base"
          >
            Ouvrir le dossier d&apos;enquête 📁
          </Button>
        </div>
      </div>
    );
  }

  // ── END ────────────────────────────────────────────────────────────
  if (phase === "end") {
    return (
      <div className="min-h-screen flex flex-col bg-[#0F172A] p-6">
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Enquête résolue !</h1>
          <p className="text-white/60 text-sm mb-6 text-center">
            {score} / {questions.length} indices collectés
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 w-full">
            <p className="text-amber-400 font-semibold text-sm mb-3">📜 Résolution :</p>
            <p className="text-white/90 text-sm leading-relaxed">{resolution}</p>
          </div>

          <div className="w-full mb-6">
            <p className="text-white/50 text-xs font-semibold mb-3 uppercase tracking-wider">
              Indices collectés
            </p>
            <div className="flex flex-col gap-2">
              {collectedClues.map((clue, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-xl">{clue.clueEmoji}</span>
                  <p className="text-white/80 text-sm">{clue.clue}</p>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => router.push("/student/home")}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-12 rounded-2xl"
          >
            Retour aux enquêtes
          </Button>
        </div>
      </div>
    );
  }

  // ── CLUE REVEAL ────────────────────────────────────────────────────
  if (phase === "clue-reveal") {
    return (
      <div className="min-h-screen flex flex-col bg-[#0F172A] p-6">
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center">
          <div className="text-2xl font-semibold text-[#14B8A6] mb-2">Bonne réponse ! 🎯</div>
          <p className="text-white/60 text-sm mb-8">Tu as découvert un nouvel indice !</p>

          <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-8 mb-8 w-full">
            <div className="text-5xl mb-4">{question.clueEmoji}</div>
            <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wider">
              Indice {collectedClues.length} / {questions.length}
            </p>
            <p className="text-white font-semibold text-lg">{question.clue}</p>
          </div>

          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                  i < collectedClues.length
                    ? "bg-amber-500/20 border border-amber-500/50"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {i < collectedClues.length ? questions[i].clueEmoji : "?"}
              </div>
            ))}
          </div>

          <Button
            onClick={nextQuestion}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold h-12 rounded-2xl px-8"
          >
            {current + 1 >= questions.length ? "Résoudre l'enquête →" : "Indice suivant →"}
          </Button>
        </div>
      </div>
    );
  }

  // ── QUESTION ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A]">
      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-all ${
                  i < collectedClues.length
                    ? "bg-amber-500"
                    : i === current
                    ? "bg-white/40"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <span className="text-white/40 text-xs ml-auto">
            {collectedClues.length}/{questions.length} indices
          </span>
        </div>
      </div>

      {/* Wrong feedback banner */}
      {phase === "wrong-feedback" && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-2xl text-sm font-semibold text-center bg-red-500/10 text-red-400 border border-red-500/20">
          {question.wrongHint || "Ce n'est pas la bonne réponse. Relis bien la question !"}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Dossier card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full">
                🔍 Question {current + 1}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{question.question}</h2>
          </div>

          <div className="flex flex-col gap-3">
            {question.choices.map((choice, i) => {
              let style = "bg-white/5 border-white/15 text-white hover:bg-white/10 hover:border-white/30";
              if (selected !== null) {
                if (i === question.correctIndex) style = "bg-[#14B8A6]/15 border-[#14B8A6] text-[#14B8A6]";
                else if (i === selected && phase === "wrong-feedback") style = "bg-red-500/15 border-red-500 text-red-400";
                else style = "bg-white/3 border-white/8 text-white/30";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleChoice(i)}
                  disabled={selected !== null}
                  className={`border-2 rounded-2xl px-5 py-4 text-left font-medium transition-all duration-200 disabled:cursor-default ${style}`}
                >
                  <span className="font-mono text-sm opacity-50 mr-3">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
