"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, Timer, Lock, Check, Printer, RotateCcw } from "lucide-react";
import { saveScore } from "../actions";

// ── Types ────────────────────────────────────────────────────────────

type CeintureQuestion = {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
};

type Belt = {
  id: string;
  name: string;             // "Ceinture Blanche"
  color: string;            // hex color of the belt
  textColor?: string;       // text color on the belt (default #fff)
  emoji?: string;
  description: string;      // "Tables de 2 et 5"
  timePerQuestion?: number; // seconds per question; 0/undefined = no timer
  questions: CeintureQuestion[];
};

type CeinturesConfig = {
  title: string;
  discipline?: string;
  intro: string;
  passThreshold?: number;   // fraction 0..1 needed to earn the belt (default 0.8)
  belts: Belt[];
};

type Answer = {
  question: string;
  chosen: string | null;    // null = time out / no answer
  correct: string;
  isCorrect: boolean;
};

type Phase =
  | { type: "dojo" }
  | { type: "belt_intro"; beltIdx: number }
  | { type: "question"; beltIdx: number; qIdx: number }
  | { type: "feedback"; beltIdx: number; qIdx: number; correct: boolean }
  | { type: "belt_result"; beltIdx: number };

// ── Belt visual ──────────────────────────────────────────────────────

function BeltVisual({ color, earned, size = "md" }: { color: string; earned?: boolean; size?: "sm" | "md" | "lg" }) {
  const h = size === "lg" ? 26 : size === "sm" ? 12 : 18;
  const isWhite = color.toUpperCase() === "#FFFFFF" || color.toUpperCase() === "#FFF" || color.toUpperCase() === "#F5F5F5";
  return (
    <div className="relative w-full flex items-center justify-center" style={{ height: h + 14 }}>
      {/* belt band */}
      <div
        className="w-full rounded-full"
        style={{
          height: h,
          background: color,
          border: isWhite ? "1.5px solid rgba(0,0,0,0.18)" : "none",
          boxShadow: earned ? `0 0 18px ${color}88` : "inset 0 -3px 6px rgba(0,0,0,0.25)",
          opacity: earned === false ? 0.4 : 1,
        }}
      />
      {/* knot */}
      <div
        className="absolute rounded-md"
        style={{
          width: h * 1.5,
          height: h + 12,
          left: "50%",
          transform: "translateX(-50%) rotate(8deg)",
          background: color,
          border: isWhite ? "1.5px solid rgba(0,0,0,0.18)" : "none",
          boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
          opacity: earned === false ? 0.4 : 1,
        }}
      />
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────

export default function CeinturesGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config = game.config as CeinturesConfig;
  const belts = config.belts;
  const threshold = config.passThreshold ?? 0.8;

  const [phase, setPhase] = useState<Phase>({ type: "dojo" });
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [key, setKey] = useState(0);
  const savedBelts = useRef<Set<string>>(new Set());

  const goTo = (next: Phase) => {
    setKey((k) => k + 1);
    setPhase(next);
  };

  // ── Per-question timer (only when belt has timePerQuestion) ──────────
  const activeBelt =
    phase.type === "question" ? belts[phase.beltIdx] : null;
  const questionTime = activeBelt?.timePerQuestion ?? 0;

  useEffect(() => {
    if (phase.type !== "question" || !questionTime) return;
    setTimeLeft(questionTime);
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.type === "question" ? `${phase.beltIdx}-${phase.qIdx}` : null]);

  // Time out → record as wrong, move to feedback
  useEffect(() => {
    if (phase.type !== "question" || !questionTime) return;
    if (timeLeft === 0 && selectedChoice === null) {
      const belt = belts[phase.beltIdx];
      const q = belt.questions[phase.qIdx];
      setAnswers((prev) => [
        ...prev,
        { question: q.question, chosen: null, correct: q.choices[q.correctIndex], isCorrect: false },
      ]);
      goTo({ type: "feedback", beltIdx: phase.beltIdx, qIdx: phase.qIdx, correct: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // ── Answer handler ──────────────────────────────────────────────────
  const handleAnswer = (beltIdx: number, qIdx: number, choiceIdx: number) => {
    if (selectedChoice !== null) return;
    const belt = belts[beltIdx];
    const q = belt.questions[qIdx];
    setSelectedChoice(choiceIdx);
    const isCorrect = choiceIdx === q.correctIndex;
    setAnswers((prev) => [
      ...prev,
      { question: q.question, chosen: q.choices[choiceIdx], correct: q.choices[q.correctIndex], isCorrect },
    ]);
    setTimeout(() => {
      setSelectedChoice(null);
      goTo({ type: "feedback", beltIdx, qIdx, correct: isCorrect });
    }, 550);
  };

  // ── Feedback → next question or belt result ─────────────────────────
  const handleFeedbackNext = (beltIdx: number, qIdx: number) => {
    const belt = belts[beltIdx];
    if (qIdx + 1 >= belt.questions.length) {
      goTo({ type: "belt_result", beltIdx });
    } else {
      goTo({ type: "question", beltIdx, qIdx: qIdx + 1 });
    }
  };

  // ── Start a belt attempt ────────────────────────────────────────────
  const startBelt = (beltIdx: number) => {
    setAnswers([]);
    setSelectedChoice(null);
    goTo({ type: "question", beltIdx, qIdx: 0 });
  };

  // ── Belt result computation + save on earn ──────────────────────────
  const beltCorrect = answers.filter((a) => a.isCorrect).length;
  const beltTotal = answers.length;
  const beltPct = beltTotal > 0 ? beltCorrect / beltTotal : 0;
  const beltPassed = beltPct >= threshold;

  useEffect(() => {
    if (phase.type !== "belt_result") return;
    const belt = belts[phase.beltIdx];
    if (beltPassed && !earned.has(belt.id)) {
      const newEarned = new Set(earned);
      newEarned.add(belt.id);
      setEarned(newEarned);
      if (!savedBelts.current.has(belt.id)) {
        savedBelts.current.add(belt.id);
        const pct = Math.round((newEarned.size / belts.length) * 100);
        saveScore(studentId, game.id, pct);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const isUnlocked = (idx: number) =>
    idx === 0 || earned.has(belts[idx - 1].id);

  const allEarned = earned.size === belts.length;
  const nextBeltIdx =
    phase.type === "belt_result" && phase.beltIdx + 1 < belts.length
      ? phase.beltIdx + 1
      : null;

  const timerPct = questionTime ? (timeLeft / questionTime) * 100 : 0;
  const timerColor = timerPct > 50 ? "#22c55e" : timerPct > 25 ? "#f59e0b" : "#ef4444";

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#0c1220 0%,#161f33 55%,#0c1220 100%)" }}
    >
      {/* Question timer bar */}
      {phase.type === "question" && questionTime > 0 && (
        <div className="fixed top-0 left-0 right-0 z-10 print:hidden">
          <div className="h-1.5 w-full bg-white/10">
            <div
              className="h-full transition-all duration-1000 ease-linear"
              style={{ width: `${timerPct}%`, background: timerColor }}
            />
          </div>
          <div className="flex items-center justify-center px-4 py-2" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-2" style={{ color: timerColor }}>
              <Timer className="w-4 h-4" />
              <span className="font-bold text-sm tabular-nums">{timeLeft}s</span>
            </div>
          </div>
        </div>
      )}

      <div key={key} className="w-full max-w-md animate-fade-up">

        {/* ── DOJO (belt selection) ── */}
        {phase.type === "dojo" && (
          <div className="text-center">
            <div className="text-7xl mb-4">🥋</div>
            <h1 className="text-3xl font-extrabold text-white mb-1 leading-tight">{config.title}</h1>
            {config.discipline && (
              <p className="text-sm mb-3" style={{ color: "#93c5fd" }}>{config.discipline}</p>
            )}
            <div className="rounded-2xl p-4 mb-5 text-left"
              style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>{config.intro}</p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>
                {earned.size} / {belts.length} ceintures
              </span>
              {allEarned && <span className="text-lg">🏆</span>}
            </div>

            <div className="space-y-3 mb-5">
              {belts.map((belt, idx) => {
                const unlocked = isUnlocked(idx);
                const hasEarned = earned.has(belt.id);
                return (
                  <button
                    key={belt.id}
                    onClick={() => unlocked && goTo({ type: "belt_intro", beltIdx: idx })}
                    disabled={!unlocked}
                    className="w-full rounded-2xl p-4 flex items-center gap-4 text-left transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(15,23,42,0.85)",
                      border: hasEarned ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(59,130,246,0.15)",
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    <div className="w-16 shrink-0">
                      <BeltVisual color={belt.color} size="sm" earned={hasEarned} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {belt.emoji ? `${belt.emoji} ` : ""}{belt.name}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>{belt.description}</p>
                    </div>
                    {hasEarned ? (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "rgba(34,197,94,0.2)" }}>
                        <Check className="w-4 h-4" style={{ color: "#22c55e" }} />
                      </div>
                    ) : unlocked ? (
                      <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "#3b82f6" }} />
                    ) : (
                      <Lock className="w-4 h-4 shrink-0" style={{ color: "#64748b" }} />
                    )}
                  </button>
                );
              })}
            </div>

            {allEarned && (
              <button
                onClick={() => window.print()}
                className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 mb-3 print:hidden"
                style={{ background: "rgba(59,130,246,0.15)", color: "#93c5fd" }}
              >
                <Printer className="w-4 h-4" /> Imprimer mon diplôme
              </button>
            )}

            <a href="/student/home"
              className="text-xs font-medium hover:underline print:hidden" style={{ color: "#64748b" }}>
              ← Retour aux jeux
            </a>

            {/* Print-only diploma */}
            {allEarned && (
              <div className="hidden print:block text-left mt-6 text-black">
                <h2 className="text-xl font-bold mb-2">Diplôme — {config.title}</h2>
                <p className="text-sm mb-3">Toutes les ceintures obtenues :</p>
                <ul className="text-sm list-disc pl-5">
                  {belts.map((b) => <li key={b.id}>{b.name} — {b.description}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── BELT INTRO ── */}
        {phase.type === "belt_intro" && (() => {
          const belt = belts[phase.beltIdx];
          return (
            <div className="text-center">
              <div className="px-6 mb-5">
                <BeltVisual color={belt.color} size="lg" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1">
                {belt.emoji ? `${belt.emoji} ` : ""}{belt.name}
              </h2>
              <p className="text-sm mb-5" style={{ color: "#93c5fd" }}>{belt.description}</p>
              <div className="flex gap-3 mb-6">
                <div className="flex-1 rounded-xl py-3 text-center"
                  style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <div className="text-xl font-bold text-white">{belt.questions.length}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>Calculs</div>
                </div>
                <div className="flex-1 rounded-xl py-3 text-center"
                  style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <div className="text-xl font-bold text-white">{Math.ceil(belt.questions.length * threshold)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>Pour réussir</div>
                </div>
                <div className="flex-1 rounded-xl py-3 text-center"
                  style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <div className="text-xl font-bold text-white">
                    {belt.timePerQuestion ? `${belt.timePerQuestion}s` : "∞"}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
                    {belt.timePerQuestion ? "Par calcul" : "Sans chrono"}
                  </div>
                </div>
              </div>
              <button onClick={() => startBelt(phase.beltIdx)}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: "#3b82f6", color: "#fff" }}>
                Commencer l&apos;épreuve <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => goTo({ type: "dojo" })}
                className="mt-3 text-xs font-medium hover:underline" style={{ color: "#64748b" }}>
                ← Retour au dojo
              </button>
            </div>
          );
        })()}

        {/* ── QUESTION ── */}
        {phase.type === "question" && (() => {
          const belt = belts[phase.beltIdx];
          const q = belt.questions[phase.qIdx];
          return (
            <div className={questionTime ? "mt-14" : ""}>
              {/* progress dots */}
              <div className="flex items-center gap-1.5 mb-4">
                {belt.questions.map((_, i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                    style={{ background: i < phase.qIdx ? "#3b82f6" : i === phase.qIdx ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)" }} />
                ))}
              </div>
              <div className="rounded-2xl p-5 mb-4"
                style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
                  {belt.name} · Calcul {phase.qIdx + 1} / {belt.questions.length}
                </p>
                <p className="text-2xl font-extrabold text-white leading-snug">{q.question}</p>
              </div>
              <div className="space-y-2">
                {q.choices.map((choice, i) => {
                  const isSelected = selectedChoice === i;
                  const isCorrect = i === q.correctIndex;
                  return (
                    <button key={i} onClick={() => handleAnswer(phase.beltIdx, phase.qIdx, i)}
                      disabled={selectedChoice !== null}
                      className="w-full text-left px-4 py-3.5 rounded-xl font-bold text-base flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                      style={{
                        background: isSelected ? (isCorrect ? "#16a34a" : "#dc2626") : "rgba(15,23,42,0.85)",
                        border: isSelected ? "none" : "1px solid rgba(59,130,246,0.18)",
                        color: isSelected ? "#fff" : "#cbd5e1",
                      }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
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
          const belt = belts[phase.beltIdx];
          const q = belt.questions[phase.qIdx];
          const last = phase.qIdx + 1 >= belt.questions.length;
          return (
            <div className="text-center">
              <div className="text-6xl mb-4">{phase.correct ? "✅" : "❌"}</div>
              <div className="rounded-2xl p-5 mb-5 text-left"
                style={{ background: "rgba(15,23,42,0.85)", border: `1px solid ${phase.correct ? "rgba(34,197,94,0.35)" : "rgba(248,113,113,0.35)"}` }}>
                <p className="text-[13px] font-bold mb-1" style={{ color: phase.correct ? "#4ade80" : "#fca5a5" }}>
                  {phase.correct ? "Correct !" : `✓ ${q.choices[q.correctIndex]}`}
                </p>
                {q.explanation && (
                  <p className="text-xs leading-relaxed mt-1" style={{ color: "#94a3b8" }}>{q.explanation}</p>
                )}
              </div>
              <button onClick={() => handleFeedbackNext(phase.beltIdx, phase.qIdx)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "#3b82f6", color: "#fff" }}>
                {last ? "Voir le résultat" : "Calcul suivant"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* ── BELT RESULT (feuille de résultats) ── */}
        {phase.type === "belt_result" && (() => {
          const belt = belts[phase.beltIdx];
          return (
            <div className="text-center">
              <div className="text-7xl mb-3">{beltPassed ? "🎉" : "💪"}</div>
              {beltPassed ? (
                <>
                  <h2 className="text-2xl font-extrabold text-white mb-1">Ceinture obtenue !</h2>
                  <p className="text-sm mb-4" style={{ color: "#4ade80" }}>
                    Tu décroches la {belt.name} !
                  </p>
                  <div className="px-6 mb-5">
                    <BeltVisual color={belt.color} size="lg" earned />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-extrabold text-white mb-1">Presque !</h2>
                  <p className="text-sm mb-4" style={{ color: "#fca5a5" }}>
                    Il te faut {Math.ceil(belt.questions.length * threshold)} bonnes réponses. Réessaie !
                  </p>
                </>
              )}

              <div className="rounded-2xl p-4 mb-5"
                style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <p className="text-sm font-bold text-white mb-3">
                  {beltCorrect} / {beltTotal} bonnes réponses
                </p>
                {/* feuille de résultats */}
                <div className="space-y-2">
                  {answers.map((a, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-left py-1.5"
                      style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      <span className="text-base shrink-0">{a.isCorrect ? "✅" : "❌"}</span>
                      <span className="text-xs font-semibold text-white flex-1">{a.question}</span>
                      {a.isCorrect ? (
                        <span className="text-xs font-bold tabular-nums" style={{ color: "#4ade80" }}>{a.correct}</span>
                      ) : (
                        <span className="text-xs text-right">
                          <span className="line-through" style={{ color: "#64748b" }}>{a.chosen ?? "—"}</span>
                          <span className="font-bold ml-1.5 tabular-nums" style={{ color: "#fca5a5" }}>{a.correct}</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {beltPassed && nextBeltIdx !== null ? (
                  <button onClick={() => goTo({ type: "belt_intro", beltIdx: nextBeltIdx })}
                    className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
                    style={{ background: "#3b82f6", color: "#fff" }}>
                    Ceinture suivante <ChevronRight className="w-4 h-4" />
                  </button>
                ) : beltPassed && allEarned ? (
                  <div className="rounded-2xl p-4 mb-1"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <p className="text-sm font-bold" style={{ color: "#4ade80" }}>
                      🏆 Toutes les ceintures obtenues — tu es ceinture noire !
                    </p>
                  </div>
                ) : !beltPassed ? (
                  <button onClick={() => startBelt(phase.beltIdx)}
                    className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
                    style={{ background: "#3b82f6", color: "#fff" }}>
                    <RotateCcw className="w-4 h-4" /> Réessayer
                  </button>
                ) : null}
                <button onClick={() => goTo({ type: "dojo" })}
                  className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: "rgba(59,130,246,0.15)", color: "#93c5fd" }}>
                  Retour au dojo
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
