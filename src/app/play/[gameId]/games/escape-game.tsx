"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveScore } from "../actions";

type EscapeQuestion = {
  question: string;
  choices: string[];
  correctIndex: number;
  codeDigit: string;
  wrongHint?: string;
};

type EscapeConfig = {
  scenario: string;
  setting: string;
  questions: EscapeQuestion[];
};

type Phase = "intro" | "question" | "feedback" | "end";

const ENCOURAGEMENTS_CORRECT = [
  "Excellent ! 🔓 Tu as trouvé un indice !",
  "Parfait ! Le code se dévoile...",
  "Bravo ! Un chiffre de plus ! 🎉",
  "Incroyable ! Tu es sur la bonne voie !",
];

const ENCOURAGEMENTS_WRONG = [
  "Pas tout à fait... Réfléchis bien avant de réessayer.",
  "Presque ! Relis attentivement la question.",
  "Essaie encore — chaque erreur t'apprend quelque chose.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function EscapeGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const router = useRouter();
  const { scenario, setting, questions } = game.config as EscapeConfig;

  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [revealedDigits, setRevealedDigits] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [attempts, setAttempts] = useState(0);

  const question = questions[current];
  const totalDigits = questions.length;

  function handleChoice(i: number) {
    if (selected !== null) return;
    const correct = i === question.correctIndex;
    setSelected(i);
    setIsCorrect(correct);
    setAttempts((a) => a + 1);

    if (correct) {
      const newDigits = [...revealedDigits, question.codeDigit];
      setRevealedDigits(newDigits);
      setScore((s) => s + 1);
      setFeedbackMsg(pick(ENCOURAGEMENTS_CORRECT));
      setPhase("feedback");

      setTimeout(() => {
        if (current + 1 >= questions.length) {
          saveScore(studentId, game.id, score + 1).then(() => setPhase("end"));
        } else {
          setCurrent((c) => c + 1);
          setSelected(null);
          setIsCorrect(null);
          setFeedbackMsg("");
          setAttempts(0);
          setPhase("question");
        }
      }, 2000);
    } else {
      setFeedbackMsg(
        question.wrongHint || pick(ENCOURAGEMENTS_WRONG)
      );
      setPhase("feedback");
      setTimeout(() => {
        setSelected(null);
        setIsCorrect(null);
        setFeedbackMsg("");
        setPhase("question");
      }, 1800);
    }
  }

  // ── INTRO ──────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)" }}>
        <div className="max-w-md w-full text-center">
          <div className="text-8xl mb-6">{setting}</div>
          <h1 className="text-3xl font-bold text-white mb-4">{game.title}</h1>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 text-white/90 text-sm leading-relaxed">
            {scenario}
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {questions.map((_, i) => (
              <div key={i} className="w-10 h-12 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center">
                <span className="text-white/40 text-xl font-mono font-bold">?</span>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm mb-6">
            {questions.length} énigme{questions.length > 1 ? "s" : ""} à résoudre
          </p>
          <Button
            onClick={() => setPhase("question")}
            className="bg-white text-indigo-900 hover:bg-white/90 font-bold px-8 h-12 rounded-2xl text-base"
          >
            Commencer la mission 🔍
          </Button>
        </div>
      </div>
    );
  }

  // ── END ────────────────────────────────────────────────────────────
  if (phase === "end") {
    const fullCode = questions.map((q) => q.codeDigit).join("");
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)" }}>
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">Mission accomplie !</h1>
          <p className="text-white/70 mb-8">Tu as résolu toutes les énigmes.</p>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <p className="text-white/60 text-sm mb-3">Le code secret était :</p>
            <div className="flex justify-center gap-2">
              {fullCode.split("").map((digit, i) => (
                <div key={i} className="w-12 h-14 rounded-xl bg-white/20 border-2 border-[#FBBF24] flex items-center justify-center">
                  <span className="text-[#FBBF24] text-2xl font-mono font-bold">{digit}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/60 text-sm mb-6">
            {score} / {questions.length} bonnes réponses
          </p>
          <Button
            onClick={() => router.push("/student/home")}
            className="bg-white text-indigo-900 hover:bg-white/90 font-bold px-8 h-12 rounded-2xl"
          >
            Retour aux missions
          </Button>
        </div>
      </div>
    );
  }

  // ── QUESTION ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)" }}>
      {/* Code display */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex justify-center gap-2 mb-4">
          {questions.map((q, i) => {
            const revealed = i < revealedDigits.length;
            return (
              <div
                key={i}
                className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${
                  revealed
                    ? "bg-[#FBBF24]/20 border-[#FBBF24]"
                    : i === current
                    ? "bg-white/20 border-white/60 animate-pulse"
                    : "bg-white/10 border-white/20"
                }`}
              >
                {revealed ? (
                  <span className="text-[#FBBF24] font-mono font-bold text-lg">{q.codeDigit}</span>
                ) : (
                  <span className="text-white/30 font-mono font-bold text-lg">?</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-white/50 text-xs text-center mb-2">
          Énigme {current + 1} / {totalDigits}
        </p>
      </div>

      {/* Feedback banner */}
      {phase === "feedback" && (
        <div className={`mx-6 mt-3 px-4 py-3 rounded-2xl text-sm font-semibold text-center ${
          isCorrect ? "bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30" : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
        }`}>
          {feedbackMsg}
        </div>
      )}

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold bg-white/20 text-white/70 px-2.5 py-1 rounded-full">
                🔍 Énigme {current + 1}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{question.question}</h2>
          </div>

          <div className="flex flex-col gap-3">
            {question.choices.map((choice, i) => {
              let style = "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40";
              if (selected !== null) {
                if (i === question.correctIndex) style = "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6]";
                else if (i === selected) style = "bg-red-500/20 border-red-400 text-red-300";
                else style = "bg-white/5 border-white/10 text-white/40";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleChoice(i)}
                  disabled={selected !== null}
                  className={`border-2 rounded-2xl px-5 py-4 text-left font-medium transition-all duration-200 disabled:cursor-default ${style}`}
                >
                  <span className="font-mono text-sm opacity-60 mr-3">
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
