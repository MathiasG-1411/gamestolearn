"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Star, Zap, Shield, Crosshair } from "lucide-react";
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

type GamePhase =
  | { type: "briefing" }
  | { type: "phase_intro"; phaseIndex: number }
  | { type: "phase_quiz"; phaseIndex: number; qIndex: number; phaseCorrect: number }
  | { type: "phase_feedback"; phaseIndex: number; qIndex: number; correct: boolean; phaseCorrect: number }
  | { type: "phase_complete"; phaseIndex: number; phaseCorrect: number; phaseTotal: number }
  | { type: "boss_intro" }
  | { type: "boss_challenge"; attempts: number }
  | { type: "boss_feedback"; correct: boolean }
  | { type: "debrief"; totalCorrect: number; totalQuestions: number; bossCorrect: boolean };

export default function MissionGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config = game.config as MissionConfig;

  const [phase, setPhase] = useState<GamePhase>({ type: "briefing" });
  const [xp, setXp] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [key, setKey] = useState(0);

  const go = (next: GamePhase) => {
    setKey((k) => k + 1);
    setPhase(next);
  };

  const handlePhaseAnswer = (
    phaseIndex: number,
    qIndex: number,
    choiceIdx: number,
    phaseCorrect: number
  ) => {
    if (selectedChoice !== null) return;
    const q = config.phases[phaseIndex]?.questions[qIndex];
    if (!q) return;

    setSelectedChoice(choiceIdx);
    const correct = choiceIdx === q.correctIndex;
    const newPhaseCorrect = phaseCorrect + (correct ? 1 : 0);

    if (correct) {
      setTotalCorrect((c) => c + 1);
      setXp((x) => x + 20);
    }
    setTotalQuestions((t) => t + 1);

    setTimeout(() => {
      setSelectedChoice(null);
      go({
        type: "phase_feedback",
        phaseIndex,
        qIndex,
        correct,
        phaseCorrect: newPhaseCorrect,
      });
    }, 700);
  };

  const handlePhaseFeedbackNext = (
    phaseIndex: number,
    qIndex: number,
    phaseCorrect: number
  ) => {
    const phase = config.phases[phaseIndex];
    if (!phase) return;
    const nextQ = qIndex + 1;
    if (nextQ < phase.questions.length) {
      go({ type: "phase_quiz", phaseIndex, qIndex: nextQ, phaseCorrect });
    } else {
      go({ type: "phase_complete", phaseIndex, phaseCorrect, phaseTotal: phase.questions.length });
    }
  };

  const handlePhaseComplete = (phaseIndex: number, phaseCorrect: number) => {
    const xpEarned = config.phases[phaseIndex]?.xpReward ?? 50;
    setXp((x) => x + xpEarned);
    const nextPhase = phaseIndex + 1;
    if (nextPhase < config.phases.length) {
      go({ type: "phase_intro", phaseIndex: nextPhase });
    } else {
      go({ type: "boss_intro" });
    }
  };

  const handleBossAnswer = (choiceIdx: number, attempts: number) => {
    if (selectedChoice !== null) return;
    setSelectedChoice(choiceIdx);
    const correct = choiceIdx === config.bossChallenge.correctIndex;
    if (correct) setXp((x) => x + 50);

    setTimeout(() => {
      setSelectedChoice(null);
      go({ type: "boss_feedback", correct });
    }, 700);
  };

  const handleBossFeedbackNext = (correct: boolean) => {
    const tq = totalQuestions;
    const tc = totalCorrect;
    go({ type: "debrief", totalCorrect: tc, totalQuestions: tq, bossCorrect: correct });
  };

  useEffect(() => {
    if (phase.type === "debrief" && !scoreSaved) {
      const base = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 80) : 0;
      const bonus = phase.bossCorrect ? 20 : 0;
      saveScore(studentId, game.id, Math.min(100, base + bonus));
      setScoreSaved(true);
    }
  }, [phase, scoreSaved, totalCorrect, totalQuestions, studentId, game.id]);

  const stars =
    phase.type === "debrief"
      ? phase.bossCorrect
        ? totalQuestions > 0
          ? Math.min(3, Math.ceil(((totalCorrect / totalQuestions) * 80 + 20) / 33))
          : 3
        : totalQuestions > 0
        ? Math.max(0, Math.ceil((totalCorrect / totalQuestions) * 2.5))
        : 0
      : 0;

  const currentPhase =
    phase.type === "phase_intro" ||
    phase.type === "phase_quiz" ||
    phase.type === "phase_feedback" ||
    phase.type === "phase_complete"
      ? config.phases[phase.phaseIndex]
      : null;

  const phaseProgress =
    phase.type === "briefing"
      ? 0
      : phase.type === "phase_intro" ||
        phase.type === "phase_quiz" ||
        phase.type === "phase_feedback" ||
        phase.type === "phase_complete"
      ? ((phase.phaseIndex + 0.5) / config.phases.length) * 80
      : phase.type === "boss_intro" || phase.type === "boss_challenge" || phase.type === "boss_feedback"
      ? 85
      : 100;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg,#0a0a1a 0%,#15102a 100%)" }}
    >
      {/* Phase progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${phaseProgress}%`,
            background: "linear-gradient(90deg,#818cf8,#c084fc)",
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-5">
        {/* XP badge */}
        {phase.type !== "briefing" && phase.type !== "debrief" && (
          <div className="fixed top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-black/50 text-[#818cf8] border border-[#818cf830] z-10">
            <Zap className="w-3.5 h-3.5" />
            {xp} XP
          </div>
        )}

        <div key={key} className="w-full max-w-md animate-fade-up">

          {/* ── BRIEFING ── */}
          {phase.type === "briefing" && (
            <div className="text-center">
              <div className="text-7xl mb-4">{config.emoji}</div>
              <div className="inline-flex items-center gap-2 bg-[#818cf8]/15 text-[#818cf8] text-[11px] font-bold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
                <Shield className="w-3 h-3" />
                Briefing de mission
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                {config.title}
              </h1>
              <div className="rounded-2xl p-5 mb-4 text-left" style={{ background: "rgba(10,10,30,0.7)", border: "1px solid #818cf825" }}>
                <p className="text-sm leading-relaxed text-[#c7d2fe]">{config.briefing}</p>
              </div>
              <div className="rounded-xl px-4 py-3 mb-6 flex items-start gap-2 text-left" style={{ background: "#818cf815", border: "1px solid #818cf830" }}>
                <Crosshair className="w-4 h-4 text-[#818cf8] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-[#818cf8] uppercase tracking-wider mb-0.5">Objectif</p>
                  <p className="text-sm text-[#c7d2fe]">{config.objective}</p>
                </div>
              </div>
              <button
                onClick={() => go({ type: "phase_intro", phaseIndex: 0 })}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#818cf8,#c084fc)", color: "#fff" }}
              >
                Accepter la mission <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── PHASE INTRO ── */}
          {phase.type === "phase_intro" && currentPhase && (
            <div>
              <p className="text-[11px] font-bold text-[#818cf8] uppercase tracking-widest mb-3">
                Phase {phase.phaseIndex + 1} / {config.phases.length}
              </p>
              <h2 className="text-xl font-extrabold text-white mb-4 leading-tight">{currentPhase.title}</h2>
              <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(10,10,30,0.7)", border: "1px solid #818cf825" }}>
                <p className="text-sm leading-relaxed text-[#c7d2fe]">{currentPhase.narrative}</p>
              </div>
              <button
                onClick={() => go({ type: "phase_quiz", phaseIndex: phase.phaseIndex, qIndex: 0, phaseCorrect: 0 })}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#818cf8,#c084fc)", color: "#fff" }}
              >
                Démarrer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── PHASE QUIZ ── */}
          {phase.type === "phase_quiz" && currentPhase && (
            <div>
              <p className="text-[11px] font-bold text-[#818cf8] uppercase tracking-widest mb-1">
                {currentPhase.title}
              </p>
              <p className="text-[11px] text-[#818cf860] mb-4">
                Question {phase.qIndex + 1} / {currentPhase.questions.length}
              </p>
              <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(10,10,30,0.7)", border: "1px solid #818cf825" }}>
                <p className="text-[15px] font-bold text-white leading-snug">
                  {currentPhase.questions[phase.qIndex]?.question}
                </p>
              </div>
              <div className="space-y-2">
                {currentPhase.questions[phase.qIndex]?.choices.map((choice, i) => {
                  const isSelected = selectedChoice === i;
                  const isCorrect = i === currentPhase.questions[phase.qIndex]?.correctIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => handlePhaseAnswer(phase.phaseIndex, phase.qIndex, i, phase.phaseCorrect)}
                      disabled={selectedChoice !== null}
                      className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                      style={{
                        background: isSelected
                          ? isCorrect ? "#16a34a" : "#dc2626"
                          : "rgba(10,10,30,0.7)",
                        border: `1px solid ${isSelected ? "transparent" : "#818cf825"}`,
                        color: isSelected ? "#fff" : "#c7d2fe",
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "#818cf820", color: "#818cf8" }}
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

          {/* ── PHASE FEEDBACK ── */}
          {phase.type === "phase_feedback" && currentPhase && (
            <div className="text-center">
              <div className="text-5xl mb-4">{phase.correct ? "✅" : "❌"}</div>
              <div className="rounded-2xl p-5 mb-5 text-left" style={{ background: "rgba(10,10,30,0.7)", border: `1px solid ${phase.correct ? "#4ade8030" : "#f8717130"}` }}>
                {phase.correct && (
                  <p className="text-[13px] font-bold text-[#4ade80] mb-1">+20 XP !</p>
                )}
                <p className="text-sm text-[#c7d2fe]">
                  {phase.correct
                    ? "Bonne réponse !"
                    : `La bonne réponse était : ${currentPhase.questions[phase.qIndex]?.choices[currentPhase.questions[phase.qIndex]?.correctIndex ?? 0]}`}
                </p>
                {currentPhase.questions[phase.qIndex]?.explanation && (
                  <p className="text-xs text-[#818cf8] mt-2 italic">
                    {currentPhase.questions[phase.qIndex].explanation}
                  </p>
                )}
              </div>
              <button
                onClick={() => handlePhaseFeedbackNext(phase.phaseIndex, phase.qIndex, phase.phaseCorrect)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#818cf8,#c084fc)", color: "#fff" }}
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── PHASE COMPLETE ── */}
          {phase.type === "phase_complete" && currentPhase && (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-[#818cf8] font-bold text-sm uppercase tracking-widest mb-2">
                Phase terminée !
              </p>
              <h2 className="text-xl font-extrabold text-white mb-3">{currentPhase.title}</h2>
              <div className="flex justify-center gap-6 mb-5">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {phase.phaseCorrect}/{phase.phaseTotal}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">Bonnes réponses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#818cf8]">
                    +{currentPhase.xpReward}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">XP bonus</div>
                </div>
              </div>
              <button
                onClick={() => handlePhaseComplete(phase.phaseIndex, phase.phaseCorrect)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#818cf8,#c084fc)", color: "#fff" }}
              >
                {phase.phaseIndex + 1 < config.phases.length ? "Phase suivante" : "Boss final !"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── BOSS INTRO ── */}
          {phase.type === "boss_intro" && (
            <div className="text-center">
              <div className="text-7xl mb-4">👹</div>
              <div className="inline-flex items-center gap-2 bg-red-500/15 text-red-400 text-[11px] font-bold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
                Défi final
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-4 leading-tight">
                Boss
              </h2>
              <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(10,10,30,0.7)", border: "1px solid #ef444430" }}>
                <p className="text-sm leading-relaxed text-[#c7d2fe]">
                  {config.bossChallenge.narrative}
                </p>
              </div>
              <button
                onClick={() => go({ type: "boss_challenge", attempts: 0 })}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff" }}
              >
                Affronter le boss <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── BOSS CHALLENGE ── */}
          {phase.type === "boss_challenge" && (
            <div>
              <div className="inline-flex items-center gap-2 bg-red-500/15 text-red-400 text-[11px] font-bold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
                Boss final
              </div>
              <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(10,10,30,0.7)", border: "1px solid #ef444430" }}>
                <p className="text-[15px] font-bold text-white leading-snug">
                  {config.bossChallenge.question}
                </p>
              </div>
              <div className="space-y-2">
                {config.bossChallenge.choices.map((choice, i) => {
                  const isSelected = selectedChoice === i;
                  const isCorrect = i === config.bossChallenge.correctIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => handleBossAnswer(i, phase.attempts)}
                      disabled={selectedChoice !== null}
                      className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                      style={{
                        background: isSelected
                          ? isCorrect ? "#16a34a" : "#dc2626"
                          : "rgba(10,10,30,0.7)",
                        border: `1px solid ${isSelected ? "transparent" : "#ef444425"}`,
                        color: isSelected ? "#fff" : "#c7d2fe",
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "#ef444420", color: "#ef4444" }}
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

          {/* ── BOSS FEEDBACK ── */}
          {phase.type === "boss_feedback" && (
            <div className="text-center">
              <div className="text-6xl mb-4">{phase.correct ? "🏆" : "😤"}</div>
              <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(10,10,30,0.7)", border: `1px solid ${phase.correct ? "#4ade8030" : "#ef444430"}` }}>
                <p className="font-bold mb-1" style={{ color: phase.correct ? "#4ade80" : "#ef4444" }}>
                  {phase.correct ? "Boss vaincu ! +50 XP !" : "Le boss résiste..."}
                </p>
                <p className="text-sm text-[#c7d2fe]">
                  {phase.correct
                    ? "Félicitations, vous avez triomphé !"
                    : `La bonne réponse était : ${config.bossChallenge.choices[config.bossChallenge.correctIndex]}`}
                </p>
              </div>
              <button
                onClick={() => handleBossFeedbackNext(phase.correct)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#818cf8,#c084fc)", color: "#fff" }}
              >
                Voir le bilan <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── DEBRIEF ── */}
          {phase.type === "debrief" && (
            <div className="text-center">
              <div className="text-7xl mb-4">{phase.bossCorrect ? "🎖️" : "📋"}</div>
              <div className="inline-flex items-center gap-2 bg-[#818cf8]/15 text-[#818cf8] text-[11px] font-bold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
                Débriefing
              </div>
              <h2 className="text-xl font-extrabold text-white mb-3 tracking-tight">
                Mission {phase.bossCorrect ? "réussie" : "terminée"}
              </h2>
              <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(10,10,30,0.7)", border: "1px solid #818cf825" }}>
                <p className="text-sm text-[#c7d2fe]">{config.debrief}</p>
              </div>
              <div className="flex justify-center gap-8 mb-5">
                <div>
                  <div className="text-2xl font-bold text-[#818cf8]">{xp}</div>
                  <div className="text-xs text-white/50 mt-0.5">XP total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {phase.totalCorrect}/{phase.totalQuestions}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">Bonnes réponses</div>
                </div>
                <div>
                  <div className="flex justify-center gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className="w-6 h-6"
                        style={{
                          color: s <= stars ? "#fbbf24" : "#ffffff20",
                          fill: s <= stars ? "#fbbf24" : "transparent",
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
                style={{ background: "linear-gradient(135deg,#818cf8,#c084fc)", color: "#fff" }}
              >
                Retour aux jeux
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
