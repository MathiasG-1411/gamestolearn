"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, ChevronRight, Star, Timer } from "lucide-react";
import { saveScore } from "../actions";

type Challenge = {
  question: string;
  choices: string[];
  correctIndex: number;
  points: number;
  timeBonusSeconds?: number;
};

type DefiConfig = {
  title: string;
  emoji: string;
  narrative: string;
  totalTimeSeconds: number;
  challenges: Challenge[];
};

type Phase =
  | { type: "intro" }
  | { type: "countdown"; count: number }
  | { type: "challenge"; idx: number }
  | { type: "feedback"; idx: number; correct: boolean; pointsEarned: number }
  | { type: "ending" };

export default function DefiGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config = game.config as DefiConfig;
  const challenges = config.challenges;

  const [phase, setPhase] = useState<Phase>({ type: "intro" });
  const [timeLeft, setTimeLeft] = useState(config.totalTimeSeconds);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [errors, setErrors] = useState<{ question: string; correctAnswer: string }[]>([]);
  const [key, setKey] = useState(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const goTo = (next: Phase) => {
    setKey((k) => k + 1);
    setPhase(next);
  };

  // Global countdown — only ticks during "challenge" phase
  useEffect(() => {
    if (phase.type !== "challenge") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.type === "challenge" ? phase.idx : null]);

  // End game when time runs out during challenge
  useEffect(() => {
    if (timeLeft === 0 && phaseRef.current.type === "challenge") {
      goTo({ type: "ending" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Countdown 3-2-1 animation
  useEffect(() => {
    if (phase.type !== "countdown") return;
    if (phase.count <= 0) {
      goTo({ type: "challenge", idx: 0 });
      return;
    }
    const t = setTimeout(() => setPhase({ type: "countdown", count: phase.count - 1 }), 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.type === "countdown" ? phase.count : null]);

  const handleAnswer = (idx: number, choiceIdx: number) => {
    if (selectedChoice !== null) return;
    const challenge = challenges[idx];
    if (!challenge) return;

    setSelectedChoice(choiceIdx);
    const isCorrect = choiceIdx === challenge.correctIndex;

    if (isCorrect) {
      const pts = challenge.points + Math.floor(timeLeft * 1.5);
      setScore((s) => s + pts);
      setCorrectCount((c) => c + 1);
      if (challenge.timeBonusSeconds) {
        setTimeLeft((t) => Math.min(config.totalTimeSeconds, t + challenge.timeBonusSeconds!));
      }
      setTimeout(() => {
        setSelectedChoice(null);
        goTo({ type: "feedback", idx, correct: true, pointsEarned: pts });
      }, 600);
    } else {
      setErrors((prev) => [
        ...prev,
        { question: challenge.question, correctAnswer: challenge.choices[challenge.correctIndex] },
      ]);
      setTimeout(() => {
        setSelectedChoice(null);
        goTo({ type: "feedback", idx, correct: false, pointsEarned: 0 });
      }, 600);
    }
  };

  const handleFeedbackNext = (idx: number) => {
    if (idx + 1 >= challenges.length) {
      goTo({ type: "ending" });
    } else {
      goTo({ type: "challenge", idx: idx + 1 });
    }
  };

  useEffect(() => {
    if (phase.type === "ending" && !scoreSaved) {
      const pct = Math.min(100, Math.round((correctCount / challenges.length) * 100));
      saveScore(studentId, game.id, pct);
      setScoreSaved(true);
    }
  }, [phase, scoreSaved, correctCount, challenges.length, studentId, game.id]);

  const timerPct = (timeLeft / config.totalTimeSeconds) * 100;
  const timerColor = timerPct > 50 ? "#22c55e" : timerPct > 25 ? "#f59e0b" : "#ef4444";
  const stars =
    correctCount >= challenges.length
      ? 3
      : correctCount >= Math.ceil(challenges.length * 0.6)
      ? 2
      : correctCount > 0
      ? 1
      : 0;

  const showTimer = phase.type === "challenge" || phase.type === "feedback";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#150505 0%,#2d0a0a 60%,#150505 100%)" }}
    >
      {/* Timer bar */}
      {showTimer && (
        <div className="fixed top-0 left-0 right-0 z-10">
          <div className="h-1.5 w-full bg-white/10">
            <div
              className="h-full transition-all duration-1000 ease-linear"
              style={{ width: `${timerPct}%`, background: timerColor }}
            />
          </div>
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            <div className="flex items-center gap-1.5" style={{ color: timerColor }}>
              <Timer className="w-4 h-4" />
              <span className="font-bold text-sm tabular-nums">{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Zap className="w-4 h-4" />
              <span className="font-bold text-sm">{score} pts</span>
            </div>
          </div>
        </div>
      )}

      <div
        key={key}
        className={`w-full max-w-md animate-fade-up ${showTimer ? "mt-16" : ""}`}
      >
        {/* ── INTRO ── */}
        {phase.type === "intro" && (
          <div className="text-center">
            <div className="text-8xl mb-5">{config.emoji}</div>
            <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight">
              {config.title}
            </h1>
            <div
              className="rounded-2xl p-5 mb-5 text-left"
              style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "#fca5a5" }}>
                {config.narrative}
              </p>
            </div>
            <div className="flex gap-3 mb-6">
              <div
                className="flex-1 rounded-xl py-3 text-center"
                style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <div className="text-xl font-bold text-white">{config.totalTimeSeconds}s</div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(252,165,165,0.6)" }}>
                  Temps total
                </div>
              </div>
              <div
                className="flex-1 rounded-xl py-3 text-center"
                style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <div className="text-xl font-bold text-white">{challenges.length}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(252,165,165,0.6)" }}>
                  Défis
                </div>
              </div>
            </div>
            <button
              onClick={() => goTo({ type: "countdown", count: 3 })}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              Lancer le défi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {phase.type === "countdown" && (
          <div className="text-center">
            <div
              className="text-[120px] font-extrabold leading-none select-none"
              style={{
                color: phase.count === 0 ? "#ef4444" : "#fff",
                textShadow: "0 0 60px rgba(239,68,68,0.6)",
              }}
            >
              {phase.count === 0 ? "GO !" : phase.count}
            </div>
          </div>
        )}

        {/* ── CHALLENGE ── */}
        {phase.type === "challenge" && (
          <div>
            <div
              className="rounded-2xl p-5 mb-4"
              style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "rgba(252,165,165,0.55)" }}
              >
                Défi {phase.idx + 1} / {challenges.length}
              </p>
              <p className="text-[16px] font-bold text-white leading-snug">
                {challenges[phase.idx]?.question}
              </p>
              {challenges[phase.idx]?.timeBonusSeconds && (
                <p className="text-[10px] mt-2" style={{ color: "rgba(74,222,128,0.7)" }}>
                  ⚡ +{challenges[phase.idx].timeBonusSeconds}s bonus si correct
                </p>
              )}
            </div>
            <div className="space-y-2">
              {challenges[phase.idx]?.choices.map((choice, i) => {
                const isSelected = selectedChoice === i;
                const isCorrect = i === challenges[phase.idx]?.correctIndex;
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(phase.idx, i)}
                    disabled={selectedChoice !== null}
                    className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                    style={{
                      background: isSelected
                        ? isCorrect
                          ? "#16a34a"
                          : "#dc2626"
                        : "rgba(30,5,5,0.85)",
                      border: isSelected ? "none" : "1px solid rgba(239,68,68,0.18)",
                      color: isSelected ? "#fff" : "#fca5a5",
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
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
        {phase.type === "feedback" && (
          <div className="text-center">
            <div className="text-6xl mb-4">{phase.correct ? "✅" : "❌"}</div>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{
                background: "rgba(30,5,5,0.85)",
                border: `1px solid ${phase.correct ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.35)"}`,
              }}
            >
              {phase.correct && (
                <p className="text-[13px] font-bold mb-1" style={{ color: "#4ade80" }}>
                  +{phase.pointsEarned} points !
                </p>
              )}
              <p className="text-sm" style={{ color: "#fca5a5" }}>
                {phase.correct ? "Excellent !" : "Pas cette fois — continue !"}
              </p>
            </div>
            <button
              onClick={() => handleFeedbackNext(phase.idx)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              {phase.idx + 1 < challenges.length ? "Défi suivant" : "Voir les résultats"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ENDING ── */}
        {phase.type === "ending" && (
          <div className="text-center">
            <div className="text-8xl mb-4">{timeLeft <= 0 ? "⏰" : "🏆"}</div>
            <h2 className="text-2xl font-extrabold text-white mb-3">
              {timeLeft <= 0 ? "Temps écoulé !" : "Défi terminé !"}
            </h2>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p className="text-sm" style={{ color: "#fca5a5" }}>
                {correctCount} / {challenges.length} défis réussis
              </p>
            </div>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <div className="text-2xl font-extrabold text-yellow-400">{score}</div>
                <div className="text-xs text-white/50 mt-0.5">Points</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {correctCount}/{challenges.length}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Corrects</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className="w-6 h-6"
                      style={{
                        color: s <= stars ? "#ef4444" : "#ffffff30",
                        fill: s <= stars ? "#ef4444" : "transparent",
                      }}
                    />
                  ))}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Étoiles</div>
              </div>
            </div>
            {errors.length > 0 && (
              <div
                className="rounded-2xl p-4 mb-5 text-left"
                style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(252,165,165,0.6)" }}>
                  📝 À revoir ({errors.length})
                </p>
                <div className="space-y-3">
                  {errors.map((err, i) => (
                    <div key={i} className="text-left pt-2.5 first:pt-0" style={{ borderTop: i > 0 ? "1px solid rgba(239,68,68,0.15)" : "none" }}>
                      <p className="text-xs mb-1 leading-snug" style={{ color: "rgba(252,165,165,0.6)" }}>{err.question}</p>
                      <p className="text-xs font-semibold" style={{ color: "#fca5a5" }}>✓ {err.correctAnswer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <a
              href="/student/home"
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              Retour aux jeux
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
