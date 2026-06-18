"use client";
import { useState, useEffect } from "react";
import { saveScore } from "../actions";

type MissionQuestion = {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
};

type MissionPhase = {
  id: string;
  title: string;
  narrative: string;
  questions: MissionQuestion[];
  xpReward: number;
};

type MissionConfig = {
  title: string;
  emoji: string;
  briefing: string;
  objective: string;
  phases: MissionPhase[];
  bossChallenge: {
    narrative: string;
    question: string;
    choices: string[];
    correctIndex: number;
  };
  debrief: string;
};

type Phase =
  | { type: "briefing" }
  | { type: "phase_intro"; phaseIndex: number }
  | { type: "phase_quiz"; phaseIndex: number; questionIndex: number }
  | { type: "phase_feedback"; phaseIndex: number; questionIndex: number; correct: boolean }
  | { type: "phase_complete"; phaseIndex: number; phaseScore: number }
  | { type: "boss_intro" }
  | { type: "boss_challenge" }
  | { type: "boss_feedback"; correct: boolean }
  | { type: "debrief" };

const BG = "linear-gradient(180deg, #0a0a1a 0%, #1a1020 100%)";
const ACCENT = "#818cf8";
const BOSS_ACCENT = "#ef4444";
const CARD = "rgba(15,15,30,0.85)";
const TEXT = "#e0e0ff";

interface MissionGameProps {
  game: { id: string; config: unknown };
  studentId: string;
}

export default function MissionGame({ game, studentId }: MissionGameProps) {
  const config = game.config as MissionConfig;

  const [phase, setPhase] = useState<Phase>({ type: "briefing" });
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [xp, setXp] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [bossCorrect, setBossCorrect] = useState(false);

  const totalQuestions = config.phases.reduce((sum, p) => sum + p.questions.length, 0) + 1; // +1 boss

  function goTo(next: Phase) {
    setAnimKey((k) => k + 1);
    setPhase(next);
    setSelectedIndex(null);
  }

  function handlePhaseAnswer(phaseIndex: number, questionIndex: number, choiceIndex: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(choiceIndex);
    const q = config.phases[phaseIndex].questions[questionIndex];
    const correct = choiceIndex === q.correctIndex;
    if (correct) setTotalCorrect((prev) => prev + 1);
    setTotalAnswered((prev) => prev + 1);
    setTimeout(() => {
      goTo({ type: "phase_feedback", phaseIndex, questionIndex, correct });
    }, 600);
  }

  function handlePhaseFeedbackNext(phaseIndex: number, questionIndex: number) {
    const p = config.phases[phaseIndex];
    if (questionIndex + 1 < p.questions.length) {
      goTo({ type: "phase_quiz", phaseIndex, questionIndex: questionIndex + 1 });
    } else {
      const phaseScore = Math.round((totalCorrect / Math.max(1, totalAnswered)) * 100);
      const gainedXp = p.xpReward;
      setXp((prev) => prev + gainedXp);
      goTo({ type: "phase_complete", phaseIndex, phaseScore });
    }
  }

  function handleBossAnswer(choiceIndex: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(choiceIndex);
    const correct = choiceIndex === config.bossChallenge.correctIndex;
    if (correct) setTotalCorrect((prev) => prev + 1);
    setTotalAnswered((prev) => prev + 1);
    setBossCorrect(correct);
    setTimeout(() => {
      goTo({ type: "boss_feedback", correct });
    }, 600);
  }

  useEffect(() => {
    if (phase.type === "debrief" && !scoreSaved) {
      setScoreSaved(true);
      const score = Math.min(100, Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100));
      saveScore(studentId, game.id, score);
    }
  }, [phase, scoreSaved, totalCorrect, totalQuestions, studentId, game.id]);

  const currentPhaseIndex = phase.type === "phase_intro" || phase.type === "phase_quiz" || phase.type === "phase_feedback" || phase.type === "phase_complete"
    ? phase.phaseIndex
    : phase.type === "boss_intro" || phase.type === "boss_challenge" || phase.type === "boss_feedback"
    ? config.phases.length
    : -1;

  const showProgress = currentPhaseIndex >= 0;
  const progressWidth = showProgress ? (currentPhaseIndex / config.phases.length) * 100 : 0;

  const stars = (() => {
    const pct = Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100);
    if (pct >= 90) return 3;
    if (pct >= 70) return 2;
    if (pct >= 40) return 1;
    return 0;
  })();

  return (
    <div
      style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "system-ui, sans-serif" }}
      className="relative flex flex-col items-center justify-center p-4"
    >
      {/* Phase progress bar */}
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
          <div
            style={{ width: `${progressWidth}%`, background: ACCENT, transition: "width 0.5s ease" }}
            className="h-full"
          />
        </div>
      )}

      {/* XP indicator */}
      {phase.type !== "briefing" && phase.type !== "debrief" && (
        <div
          style={{ background: CARD, border: `1px solid ${ACCENT}33`, color: ACCENT }}
          className="fixed top-4 right-4 rounded-xl px-3 py-1.5 text-sm font-bold z-50 backdrop-blur-sm"
        >
          ⚡ {xp} XP
        </div>
      )}

      <div key={animKey} className="animate-fade-up w-full max-w-lg">
        {/* BRIEFING */}
        {phase.type === "briefing" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-7xl">{config.emoji}</div>
            <h1 style={{ color: ACCENT }} className="text-3xl font-black">{config.title}</h1>
            <div
              style={{ background: CARD, border: `1px solid ${ACCENT}33` }}
              className="rounded-2xl p-5 backdrop-blur-sm text-base leading-relaxed"
            >
              {config.briefing}
            </div>
            <div
              style={{ background: "rgba(129,140,248,0.1)", border: `1px solid ${ACCENT}55`, color: ACCENT }}
              className="rounded-xl p-3 w-full font-mono text-sm"
            >
              <span className="opacity-60 text-xs block mb-1">OBJECTIF</span>
              {config.objective}
            </div>
            <button
              onClick={() => goTo({ type: "phase_intro", phaseIndex: 0 })}
              style={{ background: ACCENT, color: "#000" }}
              className="px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
            >
              Accepter la mission →
            </button>
          </div>
        )}

        {/* PHASE INTRO */}
        {phase.type === "phase_intro" && (() => {
          const p = config.phases[phase.phaseIndex];
          return (
            <div className="flex flex-col items-center gap-6 text-center">
              <div style={{ color: ACCENT }} className="text-sm font-bold uppercase tracking-wider">
                Phase {phase.phaseIndex + 1} / {config.phases.length}
              </div>
              <h2 style={{ color: ACCENT }} className="text-2xl font-black">{p.title}</h2>
              <div
                style={{ background: CARD, border: `1px solid ${ACCENT}33` }}
                className="rounded-2xl p-5 backdrop-blur-sm text-base leading-relaxed"
              >
                {p.narrative}
              </div>
              <button
                onClick={() => goTo({ type: "phase_quiz", phaseIndex: phase.phaseIndex, questionIndex: 0 })}
                style={{ background: ACCENT, color: "#000" }}
                className="px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
              >
                Démarrer →
              </button>
            </div>
          );
        })()}

        {/* PHASE QUIZ */}
        {phase.type === "phase_quiz" && (() => {
          const q = config.phases[phase.phaseIndex].questions[phase.questionIndex];
          return (
            <div className="flex flex-col gap-5">
              <div style={{ color: ACCENT }} className="text-xs font-bold uppercase tracking-wider text-center">
                Question {phase.questionIndex + 1} / {config.phases[phase.phaseIndex].questions.length}
              </div>
              <div
                style={{ background: CARD, border: `1px solid ${ACCENT}33` }}
                className="rounded-2xl p-5 backdrop-blur-sm text-center font-semibold text-lg"
              >
                {q.question}
              </div>
              <div className="flex flex-col gap-3">
                {q.choices.map((choice, i) => {
                  const letters = ["A", "B", "C", "D"];
                  let bg = CARD;
                  let border = `1px solid ${ACCENT}33`;
                  if (selectedIndex !== null) {
                    if (i === q.correctIndex) {
                      bg = "rgba(34,197,94,0.25)";
                      border = "1px solid #22c55e";
                    } else if (i === selectedIndex && i !== q.correctIndex) {
                      bg = "rgba(239,68,68,0.25)";
                      border = "1px solid #ef4444";
                    }
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handlePhaseAnswer(phase.phaseIndex, phase.questionIndex, i)}
                      disabled={selectedIndex !== null}
                      style={{ background: bg, border, color: TEXT }}
                      className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:opacity-80 disabled:cursor-default"
                    >
                      <span
                        style={{ background: ACCENT, color: "#000", minWidth: 28, height: 28 }}
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

        {/* PHASE FEEDBACK */}
        {phase.type === "phase_feedback" && (() => {
          const q = config.phases[phase.phaseIndex].questions[phase.questionIndex];
          return (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="text-5xl">{phase.correct ? "✅" : "❌"}</div>
              {q.explanation && (
                <div
                  style={{ background: CARD, border: `1px solid ${ACCENT}33` }}
                  className="rounded-2xl p-5 backdrop-blur-sm text-base leading-relaxed"
                >
                  {q.explanation}
                </div>
              )}
              <button
                onClick={() => handlePhaseFeedbackNext(phase.phaseIndex, phase.questionIndex)}
                style={{ background: ACCENT, color: "#000" }}
                className="px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
              >
                Suivant →
              </button>
            </div>
          );
        })()}

        {/* PHASE COMPLETE */}
        {phase.type === "phase_complete" && (() => {
          const p = config.phases[phase.phaseIndex];
          const isLast = phase.phaseIndex + 1 >= config.phases.length;
          return (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="text-5xl">🏅</div>
              <h2 style={{ color: ACCENT }} className="text-2xl font-black">Phase terminée !</h2>
              <div style={{ color: TEXT }} className="text-lg font-semibold">{p.title}</div>
              <div
                style={{ background: CARD, border: `1px solid ${ACCENT}66` }}
                className="rounded-xl p-4 flex flex-col gap-2 w-full"
              >
                <div style={{ color: ACCENT }} className="text-xl font-black">+{p.xpReward} XP</div>
              </div>
              <button
                onClick={() => isLast ? goTo({ type: "boss_intro" }) : goTo({ type: "phase_intro", phaseIndex: phase.phaseIndex + 1 })}
                style={{ background: ACCENT, color: "#000" }}
                className="px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
              >
                {isLast ? "Boss final →" : "Phase suivante →"}
              </button>
            </div>
          );
        })()}

        {/* BOSS INTRO */}
        {phase.type === "boss_intro" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-7xl">💀</div>
            <h2 style={{ color: BOSS_ACCENT }} className="text-3xl font-black">Défi Final</h2>
            <div
              style={{ background: "rgba(30,5,5,0.9)", border: `1px solid ${BOSS_ACCENT}44` }}
              className="rounded-2xl p-5 backdrop-blur-sm text-base leading-relaxed"
            >
              {config.bossChallenge.narrative}
            </div>
            <button
              onClick={() => goTo({ type: "boss_challenge" })}
              style={{ background: BOSS_ACCENT, color: "#fff" }}
              className="px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
            >
              Affronter le boss →
            </button>
          </div>
        )}

        {/* BOSS CHALLENGE */}
        {phase.type === "boss_challenge" && (
          <div className="flex flex-col gap-5">
            <div style={{ color: BOSS_ACCENT }} className="text-xs font-bold uppercase tracking-wider text-center">
              ⚔️ Question Finale
            </div>
            <div
              style={{ background: "rgba(30,5,5,0.9)", border: `1px solid ${BOSS_ACCENT}44` }}
              className="rounded-2xl p-5 backdrop-blur-sm text-center font-semibold text-lg"
            >
              {config.bossChallenge.question}
            </div>
            <div className="flex flex-col gap-3">
              {config.bossChallenge.choices.map((choice, i) => {
                const letters = ["A", "B", "C", "D"];
                let bg = "rgba(30,5,5,0.9)";
                let border = `1px solid ${BOSS_ACCENT}33`;
                if (selectedIndex !== null) {
                  if (i === config.bossChallenge.correctIndex) {
                    bg = "rgba(34,197,94,0.25)";
                    border = "1px solid #22c55e";
                  } else if (i === selectedIndex && i !== config.bossChallenge.correctIndex) {
                    bg = "rgba(239,68,68,0.25)";
                    border = "1px solid #ef4444";
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleBossAnswer(i)}
                    disabled={selectedIndex !== null}
                    style={{ background: bg, border, color: TEXT }}
                    className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:opacity-80 disabled:cursor-default"
                  >
                    <span
                      style={{ background: BOSS_ACCENT, color: "#fff", minWidth: 28, height: 28 }}
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
        )}

        {/* BOSS FEEDBACK */}
        {phase.type === "boss_feedback" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-5xl">{bossCorrect ? "✅" : "❌"}</div>
            <div
              style={{ background: "rgba(30,5,5,0.9)", border: `1px solid ${BOSS_ACCENT}44` }}
              className="rounded-2xl p-5 backdrop-blur-sm text-base leading-relaxed"
            >
              {bossCorrect ? "Incroyable ! Vous avez vaincu le boss !" : "Le boss résiste... mais vous avez bien combattu !"}
            </div>
            <button
              onClick={() => goTo({ type: "debrief" })}
              style={{ background: BOSS_ACCENT, color: "#fff" }}
              className="px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
            >
              Terminer →
            </button>
          </div>
        )}

        {/* DEBRIEF */}
        {phase.type === "debrief" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-7xl">{config.emoji}</div>
            <h2 style={{ color: ACCENT }} className="text-2xl font-black">Mission accomplie !</h2>
            <div className="flex gap-2 justify-center text-4xl">
              {[1, 2, 3].map((s) => (
                <span key={s} style={{ opacity: s <= stars ? 1 : 0.2 }}>⭐</span>
              ))}
            </div>
            <div
              style={{ background: CARD, border: `1px solid ${ACCENT}33` }}
              className="rounded-2xl p-5 backdrop-blur-sm text-base leading-relaxed"
            >
              {config.debrief}
            </div>
            <div
              style={{ background: CARD, border: `1px solid ${ACCENT}66` }}
              className="rounded-xl p-4 flex flex-col gap-2 w-full"
            >
              <div style={{ color: ACCENT }} className="text-2xl font-black">⚡ {xp} XP</div>
              <div className="text-sm opacity-80">{totalCorrect} / {totalQuestions} bonnes réponses</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
