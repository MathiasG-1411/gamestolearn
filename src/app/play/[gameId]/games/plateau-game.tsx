"use client";

import { useState, useEffect } from "react";
import { Zap, ChevronRight, Star } from "lucide-react";
import { saveScore } from "../actions";

type BoardSpace = {
  position: number; // 1-based
  type: "question" | "bonus" | "repos" | "malus";
  question?: string;
  choices?: string[];
  correctIndex?: number;
  correctFeedback?: string;
  wrongFeedback?: string;
  bonusSpaces?: number;
  malusSpaces?: number;
  narrative?: string;
};

type PlateauConfig = {
  title: string;
  theme: "jungle" | "espace" | "desert" | "ocean";
  narrative: string;
  characterEmoji: string;
  spaces: BoardSpace[];
  endNarrative: string;
};

const THEMES = {
  jungle: {
    bg: "linear-gradient(180deg,#0d1f0d 0%,#1a3320 60%,#0d1f0d 100%)",
    accent: "#22c55e",
    text: "#bbf7d0",
    card: "rgba(0,20,0,0.75)",
    cardBorder: "#22c55e30",
    done: "#15803d",
  },
  espace: {
    bg: "linear-gradient(180deg,#020210 0%,#0a0a2e 60%,#020210 100%)",
    accent: "#818cf8",
    text: "#c7d2fe",
    card: "rgba(2,2,25,0.78)",
    cardBorder: "#818cf830",
    done: "#4338ca",
  },
  desert: {
    bg: "linear-gradient(180deg,#1c0e00 0%,#2d1a00 60%,#1c0e00 100%)",
    accent: "#fb923c",
    text: "#fed7aa",
    card: "rgba(25,12,0,0.75)",
    cardBorder: "#fb923c30",
    done: "#c2410c",
  },
  ocean: {
    bg: "linear-gradient(180deg,#020f1f 0%,#0a1f3d 60%,#020f1f 100%)",
    accent: "#38bdf8",
    text: "#bae6fd",
    card: "rgba(2,15,30,0.75)",
    cardBorder: "#38bdf830",
    done: "#0369a1",
  },
};

type Phase =
  | { type: "intro" }
  | { type: "board" }
  | { type: "question"; spaceIdx: number; attempts: number }
  | { type: "feedback"; spaceIdx: number; correct: boolean }
  | { type: "special"; spaceIdx: number }
  | { type: "ending" };

function spaceEmoji(space: BoardSpace): string {
  if (space.type === "bonus") return "⭐";
  if (space.type === "malus") return "💀";
  if (space.type === "repos") return "🏕️";
  return String(space.position);
}

export default function PlateauGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config = game.config as PlateauConfig;
  const theme = THEMES[config.theme ?? "jungle"] ?? THEMES.jungle;

  const [phase, setPhase] = useState<Phase>({ type: "intro" });
  const [position, setPosition] = useState(0); // 0-based index into spaces array
  const [xp, setXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [key, setKey] = useState(0);

  const spaces = config.spaces;

  const goTo = (nextPhase: Phase) => {
    setKey((k) => k + 1);
    setPhase(nextPhase);
  };

  const advanceFrom = (spaceIdx: number) => {
    const nextIdx = spaceIdx + 1;
    if (nextIdx >= spaces.length) {
      goTo({ type: "ending" });
      return;
    }
    setPosition(nextIdx);
    const nextSpace = spaces[nextIdx];
    if (nextSpace.type !== "question") {
      goTo({ type: "special", spaceIdx: nextIdx });
    } else {
      goTo({ type: "board" });
    }
  };

  const handleAnswer = (spaceIdx: number, choiceIdx: number, attempts: number) => {
    if (selectedChoice !== null) return;
    const space = spaces[spaceIdx];
    if (!space || space.type !== "question") return;

    setSelectedChoice(choiceIdx);
    const isCorrect = choiceIdx === space.correctIndex;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setXp((x) => x + (attempts === 0 ? 25 : 10));
    } else if (attempts >= 1) {
      // mercy rule after 2 attempts
      setXp((x) => Math.max(0, x - 5));
    }

    setTimeout(() => {
      setSelectedChoice(null);
      if (isCorrect || attempts >= 1) {
        goTo({ type: "feedback", spaceIdx, correct: isCorrect });
      } else {
        goTo({ type: "question", spaceIdx, attempts: attempts + 1 });
      }
    }, 700);
  };

  const handleSpecial = (spaceIdx: number) => {
    const space = spaces[spaceIdx];
    if (!space) return;

    if (space.type === "bonus") {
      const extra = space.bonusSpaces ?? 1;
      setXp((x) => x + 15);
      const newIdx = Math.min(spaceIdx + extra, spaces.length - 1);
      setPosition(newIdx);
      if (newIdx >= spaces.length - 1) {
        goTo({ type: "ending" });
      } else {
        goTo({ type: "board" });
      }
    } else if (space.type === "malus") {
      const back = space.malusSpaces ?? 1;
      setXp((x) => Math.max(0, x - 10));
      const newIdx = Math.max(spaceIdx - back, 0);
      setPosition(newIdx);
      goTo({ type: "board" });
    } else if (space.type === "repos") {
      setXp((x) => x + 10);
      goTo({ type: "board" });
    }
  };

  const score = Math.min(
    100,
    Math.round((correctCount / spaces.length) * 100) + Math.floor(xp / 10)
  );

  const starCount = Math.ceil((correctCount / Math.max(spaces.length, 1)) * 3);

  useEffect(() => {
    if (phase.type === "ending" && !scoreSaved) {
      saveScore(studentId, game.id, score);
      setScoreSaved(true);
    }
  }, [phase, scoreSaved, score, studentId, game.id]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: theme.bg }}
    >
      {/* XP indicator */}
      {phase.type !== "intro" && phase.type !== "ending" && (
        <div
          className="fixed top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold z-10"
          style={{
            background: "rgba(0,0,0,0.5)",
            color: theme.accent,
            border: `1px solid ${theme.cardBorder}`,
          }}
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
                {config.narrative}
              </p>
            </div>
            <button
              onClick={() => goTo({ type: "board" })}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: theme.accent, color: "#000" }}
            >
              Lancer le jeu <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── BOARD ── */}
        {phase.type === "board" && (
          <div>
            <div className="text-center text-5xl mb-4">{config.characterEmoji}</div>
            <div
              className="rounded-2xl p-4 mb-5"
              style={{ background: theme.card, border: `1px solid ${theme.cardBorder}` }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: `${theme.accent}99` }}
              >
                Plateau — Case {position + 1} / {spaces.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {spaces.map((space, idx) => {
                  const isCurrent = idx === position;
                  const isDone = idx < position;
                  return (
                    <div
                      key={idx}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                      style={{
                        background: isCurrent
                          ? theme.accent
                          : isDone
                          ? theme.done
                          : "rgba(255,255,255,0.08)",
                        color: isCurrent ? "#000" : isDone ? "#fff" : `${theme.text}80`,
                        transform: isCurrent ? "scale(1.25)" : "scale(1)",
                        boxShadow: isCurrent ? `0 0 12px ${theme.accent}80` : "none",
                      }}
                    >
                      {isCurrent
                        ? config.characterEmoji
                        : isDone
                        ? "✓"
                        : spaceEmoji(space)}
                    </div>
                  );
                })}
              </div>
            </div>
            {spaces[position].type === "question" ? (
              <button
                onClick={() => goTo({ type: "question", spaceIdx: position, attempts: 0 })}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: theme.accent, color: "#000" }}
              >
                Répondre à la question <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => goTo({ type: "special", spaceIdx: position })}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: theme.accent, color: "#000" }}
              >
                Voir la case <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ── QUESTION ── */}
        {phase.type === "question" && (() => {
          const space = spaces[phase.spaceIdx];
          return (
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
                  {space.question}
                </p>
              </div>
              <div className="space-y-2">
                {(space.choices ?? []).map((choice, i) => {
                  const isSelected = selectedChoice === i;
                  const isCorrect = i === space.correctIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(phase.spaceIdx, i, phase.attempts)}
                      disabled={selectedChoice !== null}
                      className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                      style={{
                        background: isSelected
                          ? isCorrect
                            ? "#16a34a"
                            : "#dc2626"
                          : theme.card,
                        border: isSelected ? "none" : `1px solid ${theme.cardBorder}`,
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
          );
        })()}

        {/* ── FEEDBACK ── */}
        {phase.type === "feedback" && (() => {
          const space = spaces[phase.spaceIdx];
          return (
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
                    +25 XP !
                  </p>
                )}
                <p className="text-sm" style={{ color: theme.text }}>
                  {phase.correct ? space.correctFeedback : space.wrongFeedback}
                </p>
              </div>
              <button
                onClick={() => advanceFrom(phase.spaceIdx)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: theme.accent, color: "#000" }}
              >
                Avancer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* ── SPECIAL ── */}
        {phase.type === "special" && (() => {
          const space = spaces[phase.spaceIdx];
          const isBonus = space.type === "bonus";
          const isMalus = space.type === "malus";
          const isRepos = space.type === "repos";
          return (
            <div className="text-center">
              <div className="text-7xl mb-4">
                {isBonus ? "⭐" : isMalus ? "💀" : "🏕️"}
              </div>
              <h2 className="text-xl font-extrabold text-white mb-3">
                {isBonus
                  ? `Bonus ! Avance de ${space.bonusSpaces ?? 1} case${(space.bonusSpaces ?? 1) > 1 ? "s" : ""}`
                  : isMalus
                  ? `Malus ! Recule de ${space.malusSpaces ?? 1} case${(space.malusSpaces ?? 1) > 1 ? "s" : ""}`
                  : isRepos
                  ? "Case repos ! +10 XP"
                  : "Case spéciale"}
              </h2>
              {space.narrative && (
                <div
                  className="rounded-2xl p-5 mb-5"
                  style={{ background: theme.card, border: `1px solid ${theme.cardBorder}` }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                    {space.narrative}
                  </p>
                </div>
              )}
              <button
                onClick={() => handleSpecial(phase.spaceIdx)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: theme.accent, color: "#000" }}
              >
                Continuer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* ── ENDING ── */}
        {phase.type === "ending" && (
          <div className="text-center">
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
              Plateau terminé !
            </h2>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: theme.card, border: `1px solid ${theme.cardBorder}` }}
            >
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                {config.endNarrative}
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
                  {correctCount}/{spaces.length}
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
                        color: s <= starCount ? theme.accent : "#ffffff30",
                        fill: s <= starCount ? theme.accent : "transparent",
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
