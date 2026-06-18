"use client";

import { useState, useEffect } from "react";
import { Zap, ChevronRight, Star } from "lucide-react";
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

const THEMES = {
  foret: {
    bg: "linear-gradient(180deg,#0d2b0d 0%,#1a3d1a 60%,#0d2b0d 100%)",
    accent: "#4ade80",
    text: "#bbf7d0",
    card: "rgba(0,25,0,0.72)",
    cardBorder: "#4ade8030",
  },
  espace: {
    bg: "linear-gradient(180deg,#020210 0%,#0a0a2e 60%,#020210 100%)",
    accent: "#818cf8",
    text: "#c7d2fe",
    card: "rgba(2,2,25,0.78)",
    cardBorder: "#818cf830",
  },
  chateau: {
    bg: "linear-gradient(180deg,#1c0f00 0%,#2d1a00 60%,#1c0f00 100%)",
    accent: "#fbbf24",
    text: "#fde68a",
    card: "rgba(25,12,0,0.78)",
    cardBorder: "#fbbf2430",
  },
  mer: {
    bg: "linear-gradient(180deg,#031328 0%,#0a1f3d 60%,#031328 100%)",
    accent: "#38bdf8",
    text: "#bae6fd",
    card: "rgba(3,19,40,0.78)",
    cardBorder: "#38bdf830",
  },
  ville: {
    bg: "linear-gradient(180deg,#0f0f1a 0%,#1a1a2e 60%,#0f0f1a 100%)",
    accent: "#f472b6",
    text: "#fce7f3",
    card: "rgba(12,12,20,0.78)",
    cardBorder: "#f472b630",
  },
};

type Phase =
  | { type: "intro" }
  | { type: "narrative"; chapterId: string }
  | { type: "challenge"; chapterId: string; attempts: number }
  | { type: "feedback"; chapterId: string; correct: boolean; attempts: number }
  | { type: "ending"; isGood: boolean };

export default function AventureGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config = game.config as AventureConfig;
  const theme = THEMES[config.theme ?? "foret"] ?? THEMES.foret;

  const [phase, setPhase] = useState<Phase>({ type: "intro" });
  const [xp, setXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalMainChapters] = useState(() => {
    // Count main chapters (those that are not retry chapters)
    const retryIds = new Set(config.chapters.map((c) => c.wrongNext));
    return config.chapters.filter((c) => !retryIds.has(c.id) || c.id === config.startChapterId).length;
  });
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [key, setKey] = useState(0); // for re-triggering animation

  const getChapter = (id: string) => config.chapters.find((c) => c.id === id);

  const currentChapter =
    phase.type === "narrative" ||
    phase.type === "challenge" ||
    phase.type === "feedback"
      ? getChapter(phase.chapterId)
      : null;

  const goTo = (nextPhase: Phase) => {
    setKey((k) => k + 1);
    setPhase(nextPhase);
  };

  const handleAnswer = (chapterId: string, choiceIdx: number, attempts: number) => {
    if (selectedChoice !== null) return;
    const chapter = getChapter(chapterId);
    if (!chapter) return;

    setSelectedChoice(choiceIdx);
    const isCorrect = choiceIdx === chapter.challenge.correctIndex;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setXp((x) => x + (attempts === 0 ? 30 : 15));
    }

    setTimeout(() => {
      setSelectedChoice(null);
      goTo({ type: "feedback", chapterId, correct: isCorrect, attempts });
    }, 700);
  };

  const handleFeedbackContinue = (chapterId: string, correct: boolean, attempts: number) => {
    const chapter = getChapter(chapterId);
    if (!chapter) return;

    if (correct) {
      const next = chapter.correctNext;
      if (next === "end_good") {
        setXp((x) => x + 40);
        goTo({ type: "ending", isGood: true });
      } else if (next === "end_bad") {
        goTo({ type: "ending", isGood: false });
      } else if (getChapter(next)) {
        goTo({ type: "narrative", chapterId: next });
      } else {
        goTo({ type: "ending", isGood: true });
      }
    } else {
      const next = chapter.wrongNext;
      if (next === chapterId) {
        goTo({ type: "challenge", chapterId, attempts: attempts + 1 });
      } else if (getChapter(next)) {
        goTo({ type: "narrative", chapterId: next });
      } else {
        goTo({ type: "challenge", chapterId, attempts: attempts + 1 });
      }
    }
  };

  useEffect(() => {
    if (phase.type === "ending" && !scoreSaved) {
      const pct =
        totalMainChapters > 0
          ? Math.round((correctCount / totalMainChapters) * 100)
          : 0;
      saveScore(studentId, game.id, Math.min(100, pct + Math.floor(xp / 10)));
      setScoreSaved(true);
    }
  }, [phase, scoreSaved, correctCount, totalMainChapters, xp, studentId, game.id]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: theme.bg }}
    >
      {/* Stars decoration */}
      {(config.theme === "espace" || !config.theme) && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() > 0.8 ? "2px" : "1px",
                height: Math.random() > 0.8 ? "2px" : "1px",
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}
        </div>
      )}

      {/* XP indicator */}
      {phase.type !== "intro" && phase.type !== "ending" && (
        <div
          className="fixed top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold z-10"
          style={{ background: "rgba(0,0,0,0.5)", color: theme.accent, border: `1px solid ${theme.cardBorder}` }}
        >
          <Zap className="w-3.5 h-3.5" />
          {xp} XP
        </div>
      )}

      <div key={key} className="w-full max-w-md animate-fade-up">

        {/* ── INTRO ── */}
        {phase.type === "intro" && (
          <div className="text-center">
            <div className="text-8xl mb-5 drop-shadow-2xl">{config.characterEmoji}</div>
            <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight tracking-tight">
              {config.title}
            </h1>
            <div
              className="rounded-2xl p-5 mb-7 text-left"
              style={{ background: theme.card, border: `1px solid ${theme.cardBorder}` }}
            >
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                {config.intro}
              </p>
            </div>
            <button
              onClick={() => goTo({ type: "narrative", chapterId: config.startChapterId })}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: theme.accent, color: "#000" }}
            >
              Commencer l&apos;aventure <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── NARRATIVE ── */}
        {phase.type === "narrative" && currentChapter && (
          <div>
            <div className="text-center text-5xl mb-4">{config.characterEmoji}</div>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: theme.card, border: `1px solid ${theme.cardBorder}` }}
            >
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                {currentChapter.narrative}
              </p>
            </div>
            <button
              onClick={() =>
                goTo({ type: "challenge", chapterId: currentChapter.id, attempts: 0 })
              }
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: theme.accent, color: "#000" }}
            >
              Relever le défi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── CHALLENGE ── */}
        {phase.type === "challenge" && currentChapter && (
          <div>
            <div
              className="rounded-2xl p-5 mb-4"
              style={{ background: theme.card, border: `1px solid ${theme.cardBorder}` }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: `${theme.accent}99` }}
              >
                {phase.attempts > 0 ? "Réessaie !" : "Question"}
              </p>
              <p className="text-[15px] font-bold text-white leading-snug">
                {currentChapter.challenge.question}
              </p>
            </div>
            <div className="space-y-2">
              {currentChapter.challenge.choices.map((choice, i) => {
                const isSelected = selectedChoice === i;
                const isCorrect = i === currentChapter.challenge.correctIndex;
                return (
                  <button
                    key={i}
                    onClick={() =>
                      handleAnswer(currentChapter.id, i, phase.attempts)
                    }
                    disabled={selectedChoice !== null}
                    className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                    style={{
                      background: isSelected
                        ? isCorrect
                          ? "#16a34a"
                          : "#dc2626"
                        : theme.card,
                      border: isSelected
                        ? "none"
                        : `1px solid ${theme.cardBorder}`,
                      color: isSelected ? "#fff" : theme.text,
                      transform: isSelected ? "scale(1.01)" : "",
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: `${theme.accent}25`,
                        color: theme.accent,
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {phase.type === "feedback" && currentChapter && (
          <div className="text-center">
            <div className="text-6xl mb-4">{phase.correct ? "✅" : "❌"}</div>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{
                background: theme.card,
                border: `1px solid ${phase.correct ? "#4ade8045" : "#f8717145"}`,
              }}
            >
              {phase.correct && (
                <p className="text-[13px] font-bold mb-1" style={{ color: "#4ade80" }}>
                  +{phase.attempts === 0 ? 30 : 15} XP !
                </p>
              )}
              <p className="text-sm" style={{ color: theme.text }}>
                {phase.correct
                  ? currentChapter.challenge.correctFeedback
                  : currentChapter.challenge.wrongFeedback}
              </p>
            </div>
            <button
              onClick={() =>
                handleFeedbackContinue(
                  currentChapter.id,
                  phase.correct,
                  phase.attempts
                )
              }
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: theme.accent, color: "#000" }}
            >
              {phase.correct ? "Continuer l'aventure" : "Réessayer"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ENDING ── */}
        {phase.type === "ending" && (
          <div className="text-center">
            <div className="text-8xl mb-4">
              {phase.isGood ? config.endingGood.emoji : config.endingBad.emoji}
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
              {phase.isGood ? "Mission accomplie !" : "Aventure terminée !"}
            </h2>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: theme.card, border: `1px solid ${theme.cardBorder}` }}
            >
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                {phase.isGood ? config.endingGood.text : config.endingBad.text}
              </p>
            </div>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <div className="text-2xl font-extrabold" style={{ color: theme.accent }}>
                  {xp}
                </div>
                <div className="text-xs text-white/50 mt-0.5">XP gagnés</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {correctCount}/{totalMainChapters}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Réponses justes</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className="w-6 h-6"
                      style={{
                        color:
                          s <= Math.ceil((correctCount / Math.max(totalMainChapters, 1)) * 3)
                            ? theme.accent
                            : "#ffffff30",
                        fill:
                          s <= Math.ceil((correctCount / Math.max(totalMainChapters, 1)) * 3)
                            ? theme.accent
                            : "transparent",
                      }}
                    />
                  ))}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Étoiles</div>
              </div>
            </div>
            <a
              href="/student/home"
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: theme.accent, color: "#000" }}
            >
              Retour aux jeux
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
