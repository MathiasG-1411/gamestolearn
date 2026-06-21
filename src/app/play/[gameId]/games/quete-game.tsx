"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Star, Lock, Backpack, Lightbulb, RefreshCw } from "lucide-react";
import { saveScore } from "../actions";

// ── Types ────────────────────────────────────────────────────────────
type Remediation = {
  hint: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

type Challenge = {
  id: string;
  competence?: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  remediation?: Remediation;
  reward: { item: string; emoji: string };
};

type Room = {
  id: string;
  name: string;
  emoji: string;
  narrative: string;
  challenges: Challenge[];
  exit: {
    lockedText: string;
    unlockText: string;
  };
};

type QueteConfig = {
  title: string;
  theme?: "foret" | "espace" | "chateau" | "mer" | "ville";
  intro: string;
  heroEmoji?: string;
  rooms: Room[];
  ending: { text: string; emoji: string };
};

type InventoryItem = { item: string; emoji: string };

const THEMES = {
  foret: { bg: "linear-gradient(180deg,#0d2b0d 0%,#1a3d1a 60%,#0d2b0d 100%)", accent: "#4ade80", text: "#bbf7d0", card: "rgba(0,25,0,0.72)", border: "#4ade8030" },
  espace: { bg: "linear-gradient(180deg,#020210 0%,#0a0a2e 60%,#020210 100%)", accent: "#818cf8", text: "#c7d2fe", card: "rgba(2,2,25,0.78)", border: "#818cf830" },
  chateau: { bg: "linear-gradient(180deg,#1c0f00 0%,#2d1a00 60%,#1c0f00 100%)", accent: "#fbbf24", text: "#fde68a", card: "rgba(25,12,0,0.78)", border: "#fbbf2430" },
  mer: { bg: "linear-gradient(180deg,#031328 0%,#0a1f3d 60%,#031328 100%)", accent: "#38bdf8", text: "#bae6fd", card: "rgba(3,19,40,0.78)", border: "#38bdf830" },
  ville: { bg: "linear-gradient(180deg,#0f0f1a 0%,#1a1a2e 60%,#0f0f1a 100%)", accent: "#f472b6", text: "#fce7f3", card: "rgba(12,12,20,0.78)", border: "#f472b630" },
};

type Phase =
  | { type: "intro" }
  | { type: "room"; room: number }
  | { type: "challenge"; room: number; chal: number; remed: boolean }
  | { type: "feedback"; room: number; chal: number; remed: boolean; correct: boolean }
  | { type: "exit"; room: number }
  | { type: "ending" };

export default function QueteGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config = game.config as QueteConfig;
  const theme = THEMES[config.theme ?? "chateau"] ?? THEMES.chateau;
  const heroEmoji = config.heroEmoji ?? "🧭";

  const [phase, setPhase] = useState<Phase>({ type: "intro" });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const totalChallenges = config.rooms.reduce((n, r) => n + r.challenges.length, 0);

  const goTo = (p: Phase) => {
    setAnimKey((k) => k + 1);
    setSelected(null);
    setPhase(p);
  };

  // Save score on ending
  useEffect(() => {
    if (phase.type === "ending" && !scoreSaved) {
      const pct = totalChallenges > 0 ? Math.round((firstTryCorrect / totalChallenges) * 100) : 0;
      saveScore(studentId, game.id, pct);
      setScoreSaved(true);
    }
  }, [phase, scoreSaved, firstTryCorrect, totalChallenges, studentId, game.id]);

  const getRoom = (i: number) => config.rooms[i];
  const getChal = (r: number, c: number) => config.rooms[r]?.challenges[c];

  const activeQuestion = (() => {
    if (phase.type !== "challenge") return null;
    const chal = getChal(phase.room, phase.chal);
    if (!chal) return null;
    if (phase.remed && chal.remediation) {
      return {
        question: chal.remediation.question,
        choices: chal.remediation.choices,
        correctIndex: chal.remediation.correctIndex,
      };
    }
    return { question: chal.question, choices: chal.choices, correctIndex: chal.correctIndex };
  })();

  const handleAnswer = (i: number) => {
    if (selected !== null || phase.type !== "challenge" || !activeQuestion) return;
    setSelected(i);
    const correct = i === activeQuestion.correctIndex;
    if (correct && !phase.remed) setFirstTryCorrect((n) => n + 1);
    setTimeout(() => {
      goTo({ type: "feedback", room: phase.room, chal: phase.chal, remed: phase.remed, correct });
    }, 650);
  };

  const handleFeedbackContinue = () => {
    if (phase.type !== "feedback") return;
    const chal = getChal(phase.room, phase.chal);
    if (!chal) return;

    // Wrong on first attempt + remediation available → go to remediation
    if (!phase.correct && !phase.remed && chal.remediation) {
      goTo({ type: "challenge", room: phase.room, chal: phase.chal, remed: true });
      return;
    }

    // Challenge resolved → award item, move on
    setInventory((inv) => [...inv, chal.reward]);

    const room = getRoom(phase.room);
    if (phase.chal + 1 < room.challenges.length) {
      goTo({ type: "challenge", room: phase.room, chal: phase.chal + 1, remed: false });
    } else {
      goTo({ type: "exit", room: phase.room });
    }
  };

  const handleExit = () => {
    if (phase.type !== "exit") return;
    if (phase.room + 1 < config.rooms.length) {
      goTo({ type: "room", room: phase.room + 1 });
    } else {
      goTo({ type: "ending" });
    }
  };

  // Items collected in the current room (for the door checklist)
  const roomItems = (roomIdx: number) =>
    config.rooms[roomIdx].challenges.map((c) => c.reward);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: theme.bg }}>
      {/* Inventory bar */}
      {phase.type !== "intro" && phase.type !== "ending" && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full z-10 max-w-[92vw] overflow-x-auto" style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${theme.border}` }}>
          <Backpack className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
          {inventory.length === 0 ? (
            <span className="text-[11px] whitespace-nowrap" style={{ color: `${theme.text}88` }}>Sac vide</span>
          ) : (
            inventory.map((it, i) => (
              <span key={i} className="text-base shrink-0" title={it.item}>{it.emoji}</span>
            ))
          )}
        </div>
      )}

      <div key={animKey} className="w-full max-w-md animate-fade-up">

        {/* ── INTRO ── */}
        {phase.type === "intro" && (
          <div className="text-center">
            <div className="text-8xl mb-5 drop-shadow-2xl">{heroEmoji}</div>
            <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight tracking-tight">{config.title}</h1>
            <div className="rounded-2xl p-5 mb-4 text-left" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{config.intro}</p>
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-6 flex-wrap">
              {config.rooms.map((r, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}>
                  {r.emoji} {r.name}
                </span>
              ))}
            </div>
            <button onClick={() => goTo({ type: "room", room: 0 })} className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5" style={{ background: theme.accent, color: "#000" }}>
              Commencer la quête <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ROOM ENTER ── */}
        {phase.type === "room" && (() => {
          const room = getRoom(phase.room);
          return (
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: `${theme.accent}99` }}>
                Salle {phase.room + 1} / {config.rooms.length}
              </p>
              <div className="text-7xl mb-4">{room.emoji}</div>
              <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">{room.name}</h2>
              <div className="rounded-2xl p-5 mb-5 text-left" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{room.narrative}</p>
              </div>
              <p className="text-xs mb-5" style={{ color: `${theme.text}99` }}>
                {room.challenges.length} épreuve{room.challenges.length > 1 ? "s" : ""} à résoudre pour ouvrir la porte 🔒
              </p>
              <button onClick={() => goTo({ type: "challenge", room: phase.room, chal: 0, remed: false })} className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90" style={{ background: theme.accent, color: "#000" }}>
                Entrer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* ── CHALLENGE ── */}
        {phase.type === "challenge" && activeQuestion && (() => {
          const chal = getChal(phase.room, phase.chal)!;
          return (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${theme.accent}99` }}>
                  Épreuve {phase.chal + 1} / {getRoom(phase.room).challenges.length}
                </span>
                {chal.competence && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}>
                    {chal.competence}
                  </span>
                )}
              </div>

              {phase.remed && chal.remediation && (
                <div className="rounded-xl p-3 mb-3 flex items-start gap-2" style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}40` }}>
                  <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" style={{ color: theme.accent }} />
                  <p className="text-xs leading-relaxed" style={{ color: theme.text }}>
                    <span className="font-bold">Indice : </span>{chal.remediation.hint}
                  </p>
                </div>
              )}

              <div className="rounded-2xl p-5 mb-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <p className="text-[15px] font-bold text-white leading-snug">{activeQuestion.question}</p>
              </div>

              <div className="space-y-2">
                {activeQuestion.choices.map((choice, i) => {
                  const isSel = selected === i;
                  const isCorr = i === activeQuestion.correctIndex;
                  return (
                    <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                      className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                      style={{
                        background: isSel ? (isCorr ? "#16a34a" : "#dc2626") : theme.card,
                        border: isSel ? "none" : `1px solid ${theme.border}`,
                        color: isSel ? "#fff" : theme.text,
                      }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${theme.accent}25`, color: theme.accent }}>
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
          const chal = getChal(phase.room, phase.chal)!;
          const willRemediate = !phase.correct && !phase.remed && !!chal.remediation;
          const explanation = phase.remed && chal.remediation ? chal.remediation.explanation : chal.explanation;
          return (
            <div className="text-center">
              <div className="text-6xl mb-4">{phase.correct ? "✅" : willRemediate ? "🤔" : "❌"}</div>
              <div className="rounded-2xl p-5 mb-5 text-left" style={{ background: theme.card, border: `1px solid ${phase.correct ? "#4ade8045" : "#f8717145"}` }}>
                <p className="text-[13px] font-bold mb-2" style={{ color: phase.correct ? "#4ade80" : "#fca5a5" }}>
                  {phase.correct ? "Bonne réponse !" : willRemediate ? "Pas tout à fait…" : "Ce n'était pas ça."}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{explanation}</p>
                {phase.correct && !phase.remed && (
                  <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                    <span className="text-2xl">{chal.reward.emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: theme.accent }}>
                      Tu obtiens : {chal.reward.item}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={handleFeedbackContinue} className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90" style={{ background: theme.accent, color: "#000" }}>
                {willRemediate ? (<><RefreshCw className="w-4 h-4" /> Revoir et réessayer</>) : (<>Continuer <ChevronRight className="w-4 h-4" /></>)}
              </button>
            </div>
          );
        })()}

        {/* ── EXIT (door) ── */}
        {phase.type === "exit" && (() => {
          const room = getRoom(phase.room);
          const items = roomItems(phase.room);
          const isLast = phase.room + 1 >= config.rooms.length;
          return (
            <div className="text-center">
              <div className="text-7xl mb-4">🚪</div>
              <h2 className="text-xl font-extrabold text-white mb-3 tracking-tight">La porte se déverrouille…</h2>
              <div className="rounded-2xl p-5 mb-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: `${theme.accent}99` }}>Objets utilisés</p>
                <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
                  {items.map((it, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{it.emoji}</span>
                      <span className="text-[10px]" style={{ color: theme.text }}>{it.item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold" style={{ color: "#4ade80" }}>
                  <Lock className="w-3.5 h-3.5" /> {room.exit.unlockText}
                </div>
              </div>
              <button onClick={handleExit} className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90" style={{ background: theme.accent, color: "#000" }}>
                {isLast ? "Terminer la quête 🏆" : "Salle suivante"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* ── ENDING ── */}
        {phase.type === "ending" && (
          <div className="text-center">
            <div className="text-8xl mb-4">{config.ending.emoji}</div>
            <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Quête accomplie !</h2>
            <div className="rounded-2xl p-5 mb-5 text-left" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{config.ending.text}</p>
            </div>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <div className="text-2xl font-extrabold text-white">{firstTryCorrect}/{totalChallenges}</div>
                <div className="text-xs text-white/50 mt-0.5">Du premier coup</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold" style={{ color: theme.accent }}>{inventory.length}</div>
                <div className="text-xs text-white/50 mt-0.5">Objets trouvés</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map((s) => {
                    const lit = s <= Math.ceil((firstTryCorrect / Math.max(totalChallenges, 1)) * 3);
                    return <Star key={s} className="w-6 h-6" style={{ color: lit ? theme.accent : "#ffffff30", fill: lit ? theme.accent : "transparent" }} />;
                  })}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Étoiles</div>
              </div>
            </div>
            <a href="/student/home" className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90" style={{ background: theme.accent, color: "#000" }}>
              Retour aux jeux
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
