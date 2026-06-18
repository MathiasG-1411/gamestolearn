"use client";
import { useState, useEffect } from "react";
import { saveScore } from "../actions";

type Challenge = {
  question: string;
  choices: string[];
  correctIndex: number;
  correctFeedback: string;
  wrongFeedback: string;
};

type Chapter = {
  id: string;
  narrative: string;
  challenge: Challenge;
  correctNext: string;
  wrongNext: string;
};

type AventureConfig = {
  title: string;
  theme: "foret" | "espace" | "chateau" | "mer" | "ville";
  intro: string;
  character: string;
  characterEmoji: string;
  chapters: Chapter[];
  startChapterId: string;
  endingGood: { text: string; emoji: string; xp: number };
  endingBad: { text: string; emoji: string; xp: number };
};

const THEME_STYLES = {
  foret: { bg: "linear-gradient(180deg,#0d2b0d 0%,#1a3d1a 60%,#0d2b0d 100%)", accent: "#4ade80", text: "#bbf7d0", card: "rgba(0,25,0,0.75)" },
  espace: { bg: "linear-gradient(180deg,#020210 0%,#0a0a2e 60%,#020210 100%)", accent: "#818cf8", text: "#c7d2fe", card: "rgba(2,2,25,0.8)" },
  chateau: { bg: "linear-gradient(180deg,#1c0f00 0%,#2d1a00 60%,#1c0f00 100%)", accent: "#fbbf24", text: "#fde68a", card: "rgba(25,12,0,0.8)" },
  mer: { bg: "linear-gradient(180deg,#031328 0%,#0a1f3d 60%,#031328 100%)", accent: "#38bdf8", text: "#bae6fd", card: "rgba(3,19,40,0.8)" },
  ville: { bg: "linear-gradient(180deg,#0f0f1a 0%,#1a1a2e 60%,#0f0f1a 100%)", accent: "#f472b6", text: "#fce7f3", card: "rgba(12,12,20,0.8)" },
};

type Phase =
  | { type: "intro" }
  | { type: "narrative"; chapterId: string }
  | { type: "challenge"; chapterId: string; attempts: number }
  | { type: "feedback"; chapterId: string; correct: boolean; attempts: number }
  | { type: "ending"; isGood: boolean };

interface AventureGameProps {
  game: { id: string; config: unknown };
  studentId: string;
}

export default function AventureGame({ game, studentId }: AventureGameProps) {
  const config = game.config as AventureConfig;
  const theme = THEME_STYLES[config.theme] ?? THEME_STYLES.foret;

  const [phase, setPhase] = useState<Phase>({ type: "intro" });
  const [correctCount, setCorrectCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const chapterMap = new Map<string, Chapter>(config.chapters.map((c) => [c.id, c]));

  const totalMainChapters = config.chapters.filter((ch) => ch.wrongNext !== ch.id).length;

  function goTo(next: Phase) {
    setAnimKey((k) => k + 1);
    setPhase(next);
    setSelectedIndex(null);
  }

  function handleChoiceClick(chapterId: string, choiceIndex: number, attempts: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(choiceIndex);
    const chapter = chapterMap.get(chapterId)!;
    const correct = choiceIndex === chapter.challenge.correctIndex;

    setTimeout(() => {
      if (correct) {
        const isMain = chapter.wrongNext !== chapter.id;
        const isFirstTry = attempts === 0;
        const gainedXp = isMain && isFirstTry ? 30 : 15;
        setXp((prev) => prev + gainedXp);
        if (isMain && isFirstTry) setCorrectCount((prev) => prev + 1);
      }
      goTo({ type: "feedback", chapterId, correct, attempts });
    }, 600);
  }

  function handleFeedbackContinue(chapterId: string, correct: boolean, attempts: number) {
    const chapter = chapterMap.get(chapterId)!;
    if (correct) {
      const next = chapter.correctNext;
      if (next === "end_good") {
        goTo({ type: "ending", isGood: true });
      } else if (next === "end_bad") {
        goTo({ type: "ending", isGood: false });
      } else {
        goTo({ type: "narrative", chapterId: next });
      }
    } else {
      const wrongNext = chapter.wrongNext;
      if (wrongNext === chapterId) {
        goTo({ type: "challenge", chapterId, attempts: attempts + 1 });
      } else {
        goTo({ type: "narrative", chapterId: wrongNext });
      }
    }
  }

  useEffect(() => {
    if (phase.type === "ending" && !scoreSaved) {
      setScoreSaved(true);
      const score = Math.min(100, Math.round((correctCount / Math.max(1, totalMainChapters)) * 100));
      saveScore(studentId, game.id, score);
    }
  }, [phase, scoreSaved, correctCount, totalMainChapters, studentId, game.id]);

  const showXp = phase.type !== "intro" && phase.type !== "ending";

  return (
    <div
      style={{ background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "system-ui, sans-serif" }}
      className="relative flex flex-col items-center justify-center p-4"
    >
      {/* XP indicator */}
      {showXp && (
        <div
          style={{ background: theme.card, border: `1px solid ${theme.accent}33`, color: theme.accent }}
          className="fixed top-4 right-4 rounded-xl px-3 py-1.5 text-sm font-bold z-50 backdrop-blur-sm"
        >
          ⚡ {xp} XP
        </div>
      )}

      <div key={animKey} className="animate-fade-up w-full max-w-lg">
        {/* INTRO */}
        {phase.type === "intro" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-7xl mb-2">{config.characterEmoji}</div>
            <h1 style={{ color: theme.accent }} className="text-3xl font-black">{config.title}</h1>
            <div
              style={{ background: theme.card, border: `1px solid ${theme.accent}33` }}
              className="rounded-2xl p-5 backdrop-blur-sm text-base leading-relaxed"
            >
              {config.intro}
            </div>
            <button
              onClick={() => goTo({ type: "narrative", chapterId: config.startChapterId })}
              style={{ background: theme.accent, color: "#000" }}
              className="mt-4 px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
            >
              Commencer l&apos;aventure →
            </button>
          </div>
        )}

        {/* NARRATIVE */}
        {phase.type === "narrative" && (() => {
          const chapter = chapterMap.get(phase.chapterId);
          if (!chapter) return null;
          return (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="text-5xl">{config.characterEmoji}</div>
              <div
                style={{ background: theme.card, border: `1px solid ${theme.accent}33` }}
                className="rounded-2xl p-6 backdrop-blur-sm text-base leading-relaxed w-full"
              >
                {chapter.narrative}
              </div>
              <button
                onClick={() => goTo({ type: "challenge", chapterId: phase.chapterId, attempts: 0 })}
                style={{ background: theme.accent, color: "#000" }}
                className="px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
              >
                Relever le défi →
              </button>
            </div>
          );
        })()}

        {/* CHALLENGE */}
        {phase.type === "challenge" && (() => {
          const chapter = chapterMap.get(phase.chapterId);
          if (!chapter) return null;
          const { challenge } = chapter;
          return (
            <div className="flex flex-col gap-5">
              <div
                style={{ background: theme.card, border: `1px solid ${theme.accent}33` }}
                className="rounded-2xl p-5 backdrop-blur-sm text-center font-semibold text-lg"
              >
                {challenge.question}
              </div>
              <div className="flex flex-col gap-3">
                {challenge.choices.map((choice, i) => {
                  const letters = ["A", "B", "C", "D"];
                  let bg = theme.card;
                  let border = `1px solid ${theme.accent}33`;
                  if (selectedIndex !== null) {
                    if (i === challenge.correctIndex) {
                      bg = "rgba(34,197,94,0.25)";
                      border = "1px solid #22c55e";
                    } else if (i === selectedIndex && i !== challenge.correctIndex) {
                      bg = "rgba(239,68,68,0.25)";
                      border = "1px solid #ef4444";
                    }
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleChoiceClick(phase.chapterId, i, phase.attempts)}
                      disabled={selectedIndex !== null}
                      style={{ background: bg, border, color: theme.text }}
                      className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:opacity-80 disabled:cursor-default"
                    >
                      <span
                        style={{ background: theme.accent, color: "#000", minWidth: 28, height: 28 }}
                        className="rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      >
                        {letters[i]}
                      </span>
                      <span className="text-sm font-medium">{choice}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* FEEDBACK */}
        {phase.type === "feedback" && (() => {
          const chapter = chapterMap.get(phase.chapterId);
          if (!chapter) return null;
          const { correct, attempts } = phase;
          const feedback = correct ? chapter.challenge.correctFeedback : chapter.challenge.wrongFeedback;
          return (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="text-5xl">{correct ? "✅" : "❌"}</div>
              <div
                style={{ background: theme.card, border: `1px solid ${theme.accent}33` }}
                className="rounded-2xl p-5 backdrop-blur-sm text-base leading-relaxed"
              >
                {feedback}
              </div>
              <button
                onClick={() => handleFeedbackContinue(phase.chapterId, correct, attempts)}
                style={{ background: theme.accent, color: "#000" }}
                className="px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
              >
                Continuer →
              </button>
            </div>
          );
        })()}

        {/* ENDING */}
        {phase.type === "ending" && (() => {
          const ending = phase.isGood ? config.endingGood : config.endingBad;
          const totalXp = xp + ending.xp;
          return (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="text-7xl">{ending.emoji}</div>
              <h2 style={{ color: theme.accent }} className="text-2xl font-black">{phase.isGood ? "Victoire !" : "Fin de l'aventure"}</h2>
              <div
                style={{ background: theme.card, border: `1px solid ${theme.accent}33` }}
                className="rounded-2xl p-5 backdrop-blur-sm text-base leading-relaxed"
              >
                {ending.text}
              </div>
              <div
                style={{ background: theme.card, border: `1px solid ${theme.accent}66` }}
                className="rounded-xl p-4 flex flex-col gap-2 w-full"
              >
                <div style={{ color: theme.accent }} className="text-2xl font-black">⚡ {totalXp} XP</div>
                <div className="text-sm opacity-80">{correctCount} / {totalMainChapters} défis réussis du premier coup</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
