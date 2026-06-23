"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, ChevronRight, Star, Timer } from "lucide-react";
import { saveScore } from "../actions";

// ── Types ────────────────────────────────────────────────────────────

type Stage = {
  label: string;
  emoji: string;
  description?: string;
  timeSeconds: number;
};

type Challenge = {
  question: string;
  choices: string[];
  correctIndex: number;
  points: number;
  timeBonusSeconds?: number;
  stageIndex?: number;   // which stage this challenge belongs to
  explanation?: string;  // shown in feedback for formative evaluation
};

type DefiConfig = {
  title: string;
  emoji: string;
  narrative: string;
  totalTimeSeconds: number;  // used when no stages defined
  stages?: Stage[];
  challenges: Challenge[];
};

type Phase =
  | { type: "intro" }
  | { type: "countdown"; count: number }
  | { type: "challenge"; idx: number }
  | { type: "feedback"; idx: number; correct: boolean; pointsEarned: number }
  | { type: "stage_complete"; stageIdx: number; nextIdx: number }
  | { type: "stage_countdown"; nextIdx: number; nextStageIdx: number; count: number }
  | { type: "ending" };

// ── Component ────────────────────────────────────────────────────────

export default function DefiGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config     = game.config as DefiConfig;
  const challenges = config.challenges;
  const stages     = config.stages ?? null;

  const initialTime = stages ? stages[0].timeSeconds : config.totalTimeSeconds;

  const [phase,         setPhase]         = useState<Phase>({ type: "intro" });
  const [timeLeft,      setTimeLeft]      = useState(initialTime);
  const [score,         setScore]         = useState(0);
  const [correctCount,  setCorrectCount]  = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [scoreSaved,    setScoreSaved]    = useState(false);
  const [errors,        setErrors]        = useState<{ question: string; correctAnswer: string }[]>([]);
  const [key,           setKey]           = useState(0);
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const goTo = (next: Phase) => { setKey((k) => k + 1); setPhase(next); };

  // ── Timer: only ticks during "challenge" phase ──────────────────────
  useEffect(() => {
    if (phase.type !== "challenge") return;
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.type === "challenge" ? phase.idx : null]);

  // End game when time runs out
  useEffect(() => {
    if (timeLeft === 0 && phaseRef.current.type === "challenge") goTo({ type: "ending" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // ── Initial 3-2-1 countdown ─────────────────────────────────────────
  useEffect(() => {
    if (phase.type !== "countdown") return;
    if (phase.count <= 0) { goTo({ type: "challenge", idx: 0 }); return; }
    const t = setTimeout(() => setPhase({ type: "countdown", count: phase.count - 1 }), 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.type === "countdown" ? phase.count : null]);

  // ── Stage countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase.type !== "stage_countdown") return;
    if (phase.count <= 0) {
      const stageTime = stages?.[phase.nextStageIdx]?.timeSeconds ?? config.totalTimeSeconds;
      setTimeLeft(stageTime);
      setKey((k) => k + 1);
      setPhase({ type: "challenge", idx: phase.nextIdx });
      return;
    }
    const t = setTimeout(() => setPhase({ ...phase, count: phase.count - 1 }), 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.type === "stage_countdown" ? phase.count : null]);

  // ── Answer handler ──────────────────────────────────────────────────
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
        const stageMax = stages?.[challenge.stageIndex ?? 0]?.timeSeconds ?? config.totalTimeSeconds;
        setTimeLeft((t) => Math.min(stageMax, t + challenge.timeBonusSeconds!));
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

  // ── Feedback → next challenge or stage break ────────────────────────
  const handleFeedbackNext = (idx: number) => {
    const nextIdx = idx + 1;
    if (nextIdx >= challenges.length) { goTo({ type: "ending" }); return; }

    if (stages) {
      const curStage  = challenges[idx]?.stageIndex ?? 0;
      const nextStage = challenges[nextIdx]?.stageIndex ?? 0;
      if (nextStage !== curStage) {
        goTo({ type: "stage_complete", stageIdx: curStage, nextIdx });
        return;
      }
    }
    goTo({ type: "challenge", idx: nextIdx });
  };

  // ── Save score on ending ────────────────────────────────────────────
  useEffect(() => {
    if (phase.type === "ending" && !scoreSaved) {
      const pct = Math.min(100, Math.round((correctCount / challenges.length) * 100));
      saveScore(studentId, game.id, pct);
      setScoreSaved(true);
    }
  }, [phase, scoreSaved, correctCount, challenges.length, studentId, game.id]);

  // ── Computed display values ─────────────────────────────────────────
  const currentStageTime = (() => {
    if (!stages) return config.totalTimeSeconds;
    const idx        = phase.type === "challenge" || phase.type === "feedback" ? phase.idx : 0;
    const stageIndex = challenges[idx]?.stageIndex ?? 0;
    return stages[stageIndex]?.timeSeconds ?? config.totalTimeSeconds;
  })();

  const timerPct   = (timeLeft / currentStageTime) * 100;
  const timerColor = timerPct > 50 ? "#22c55e" : timerPct > 25 ? "#f59e0b" : "#ef4444";
  const stars      = correctCount >= challenges.length ? 3
    : correctCount >= Math.ceil(challenges.length * 0.6) ? 2
    : correctCount > 0 ? 1 : 0;

  const showTimer  = phase.type === "challenge" || phase.type === "feedback";

  const currentStageLabel = (() => {
    if (!stages || phase.type !== "challenge") return null;
    return stages[challenges[phase.idx]?.stageIndex ?? 0];
  })();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#150505 0%,#2d0a0a 60%,#150505 100%)" }}>

      {/* Timer bar */}
      {showTimer && (
        <div className="fixed top-0 left-0 right-0 z-10">
          <div className="h-1.5 w-full bg-white/10">
            <div className="h-full transition-all duration-1000 ease-linear"
              style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>
          <div className="flex items-center justify-between px-4 py-2" style={{ background: "rgba(0,0,0,0.55)" }}>
            <div className="flex items-center gap-2" style={{ color: timerColor }}>
              <Timer className="w-4 h-4" />
              <span className="font-bold text-sm tabular-nums">{timeLeft}s</span>
              {currentStageLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider ml-1 hidden sm:inline"
                  style={{ color: "rgba(255,255,255,0.35)" }}>
                  {currentStageLabel.emoji} {currentStageLabel.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Zap className="w-4 h-4" />
              <span className="font-bold text-sm">{score} pts</span>
            </div>
          </div>
        </div>
      )}

      <div key={key} className={`w-full max-w-md animate-fade-up ${showTimer ? "mt-16" : ""}`}>

        {/* ── INTRO ── */}
        {phase.type === "intro" && (
          <div className="text-center">
            <div className="text-8xl mb-5">{config.emoji}</div>
            <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight">{config.title}</h1>
            <div className="rounded-2xl p-5 mb-5 text-left"
              style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "#fca5a5" }}>{config.narrative}</p>
            </div>
            {stages ? (
              <div className="space-y-2 mb-6">
                {stages.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.12)" }}>
                    <span className="text-xl">{s.emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-white">{s.label}</p>
                      {s.description && <p className="text-[11px] mt-0.5" style={{ color: "rgba(252,165,165,0.6)" }}>{s.description}</p>}
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: "rgba(252,165,165,0.5)" }}>
                      {s.timeSeconds}s
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-3 mb-6">
                <div className="flex-1 rounded-xl py-3 text-center"
                  style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="text-xl font-bold text-white">{config.totalTimeSeconds}s</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(252,165,165,0.6)" }}>Temps total</div>
                </div>
                <div className="flex-1 rounded-xl py-3 text-center"
                  style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="text-xl font-bold text-white">{challenges.length}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(252,165,165,0.6)" }}>Défis</div>
                </div>
              </div>
            )}
            <button onClick={() => goTo({ type: "countdown", count: 3 })}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "#ef4444", color: "#fff" }}>
              Lancer le défi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {phase.type === "countdown" && (
          <div className="text-center">
            <div className="text-[120px] font-extrabold leading-none select-none"
              style={{ color: phase.count === 0 ? "#ef4444" : "#fff", textShadow: "0 0 60px rgba(239,68,68,0.6)" }}>
              {phase.count === 0 ? "GO !" : phase.count}
            </div>
          </div>
        )}

        {/* ── CHALLENGE ── */}
        {phase.type === "challenge" && (
          <div>
            <div className="rounded-2xl p-5 mb-4"
              style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "rgba(252,165,165,0.55)" }}>
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
                const isCorrect  = i === challenges[phase.idx]?.correctIndex;
                return (
                  <button key={i} onClick={() => handleAnswer(phase.idx, i)}
                    disabled={selectedChoice !== null}
                    className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                    style={{
                      background: isSelected ? (isCorrect ? "#16a34a" : "#dc2626") : "rgba(30,5,5,0.85)",
                      border: isSelected ? "none" : "1px solid rgba(239,68,68,0.18)",
                      color: isSelected ? "#fff" : "#fca5a5",
                    }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
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
            <div className="rounded-2xl p-5 mb-5 text-left"
              style={{ background: "rgba(30,5,5,0.85)", border: `1px solid ${phase.correct ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.35)"}` }}>
              {phase.correct ? (
                <p className="text-[13px] font-bold mb-1" style={{ color: "#4ade80" }}>
                  +{phase.pointsEarned} points !
                </p>
              ) : (
                <p className="text-[13px] font-bold mb-1" style={{ color: "#fca5a5" }}>
                  ✓ {challenges[phase.idx]?.choices[challenges[phase.idx]?.correctIndex ?? 0]}
                </p>
              )}
              {challenges[phase.idx]?.explanation ? (
                <p className="text-xs leading-relaxed mt-1" style={{ color: "rgba(252,165,165,0.7)" }}>
                  {challenges[phase.idx].explanation}
                </p>
              ) : (
                <p className="text-sm" style={{ color: "#fca5a5" }}>
                  {phase.correct ? "Excellent !" : "Continue — tu peux le faire !"}
                </p>
              )}
            </div>
            <button onClick={() => handleFeedbackNext(phase.idx)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#ef4444", color: "#fff" }}>
              {phase.idx + 1 < challenges.length ? "Défi suivant" : "Voir les résultats"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STAGE COMPLETE ── */}
        {phase.type === "stage_complete" && (
          <div className="text-center">
            <div className="text-7xl mb-4">{stages?.[phase.stageIdx]?.emoji ?? "⭐"}</div>
            <h2 className="text-2xl font-extrabold text-white mb-2">
              {stages?.[phase.stageIdx]?.label} terminé !
            </h2>
            <div className="rounded-2xl p-5 mb-5 text-left"
              style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(74,222,128,0.3)" }}>
              <p className="text-sm font-bold mb-1" style={{ color: "#4ade80" }}>Bien joué ! Niveau suivant :</p>
              <p className="text-base font-extrabold text-white mb-1">
                {stages?.[challenges[phase.nextIdx]?.stageIndex ?? 0]?.emoji}{" "}
                {stages?.[challenges[phase.nextIdx]?.stageIndex ?? 0]?.label}
              </p>
              {stages?.[challenges[phase.nextIdx]?.stageIndex ?? 0]?.description && (
                <p className="text-xs" style={{ color: "rgba(252,165,165,0.7)" }}>
                  {stages[challenges[phase.nextIdx]?.stageIndex ?? 0].description}
                </p>
              )}
            </div>
            <button
              onClick={() => goTo({
                type: "stage_countdown",
                nextIdx: phase.nextIdx,
                nextStageIdx: challenges[phase.nextIdx]?.stageIndex ?? 0,
                count: 3,
              })}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#ef4444", color: "#fff" }}>
              Niveau suivant ! <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STAGE COUNTDOWN ── */}
        {phase.type === "stage_countdown" && (
          <div className="text-center">
            <div className="text-sm font-bold mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              {stages?.[phase.nextStageIdx]?.emoji} {stages?.[phase.nextStageIdx]?.label}
            </div>
            <div className="text-[120px] font-extrabold leading-none select-none"
              style={{ color: phase.count === 0 ? "#ef4444" : "#fff", textShadow: "0 0 60px rgba(239,68,68,0.6)" }}>
              {phase.count === 0 ? "GO !" : phase.count}
            </div>
          </div>
        )}

        {/* ── ENDING ── */}
        {phase.type === "ending" && (
          <div className="text-center">
            <div className="text-8xl mb-4">{timeLeft <= 0 ? "⏰" : "🏆"}</div>
            <h2 className="text-2xl font-extrabold text-white mb-3">
              {timeLeft <= 0 ? "Temps écoulé !" : "Défi terminé !"}
            </h2>
            <div className="rounded-2xl p-5 mb-5"
              style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.2)" }}>
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
                <div className="text-2xl font-extrabold text-white">{correctCount}/{challenges.length}</div>
                <div className="text-xs text-white/50 mt-0.5">Corrects</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star key={s} className="w-6 h-6"
                      style={{ color: s <= stars ? "#ef4444" : "#ffffff30", fill: s <= stars ? "#ef4444" : "transparent" }} />
                  ))}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Étoiles</div>
              </div>
            </div>
            {errors.length > 0 && (
              <div className="rounded-2xl p-4 mb-5 text-left"
                style={{ background: "rgba(30,5,5,0.85)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "rgba(252,165,165,0.6)" }}>
                  📝 À revoir ({errors.length})
                </p>
                <div className="space-y-3">
                  {errors.map((err, i) => (
                    <div key={i} className="text-left pt-2.5 first:pt-0"
                      style={{ borderTop: i > 0 ? "1px solid rgba(239,68,68,0.15)" : "none" }}>
                      <p className="text-xs mb-1 leading-snug" style={{ color: "rgba(252,165,165,0.6)" }}>
                        {err.question}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: "#fca5a5" }}>
                        ✓ {err.correctAnswer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <a href="/student/home"
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#ef4444", color: "#fff" }}>
              Retour aux jeux
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
