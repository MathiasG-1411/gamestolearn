"use client";

import { useState, useEffect } from "react";
import { Zap, ChevronRight, Star } from "lucide-react";
import { saveScore } from "../actions";

type Piece = {
  id: string;
  name: string;
  emoji: string;
  question: string;
  choices: string[];
  correctIndex: number;
  hint: string;
  unlockText: string;
};

type ConstructionConfig = {
  title: string;
  narrative: string;
  buildTarget: string;
  buildEmoji: string;
  pieces: Piece[];
  completionText: string;
};

type Phase =
  | { type: "intro" }
  | { type: "workshop" }
  | { type: "question"; pieceIdx: number; attempts: number }
  | { type: "unlock"; pieceIdx: number }
  | { type: "hint"; pieceIdx: number }
  | { type: "ending" };

export default function ConstructionGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config = game.config as ConstructionConfig;
  const pieces = config.pieces;

  const [phase, setPhase] = useState<Phase>({ type: "intro" });
  const [unlockedPieces, setUnlockedPieces] = useState<Set<number>>(new Set());
  const [currentPieceIdx, setCurrentPieceIdx] = useState(0);
  const [xp, setXp] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [key, setKey] = useState(0);

  const goTo = (next: Phase) => {
    setKey((k) => k + 1);
    setPhase(next);
  };

  const handleAnswer = (pieceIdx: number, choiceIdx: number, attempts: number) => {
    if (selectedChoice !== null) return;
    const piece = pieces[pieceIdx];
    if (!piece) return;

    setSelectedChoice(choiceIdx);
    const isCorrect = choiceIdx === piece.correctIndex;

    setTimeout(() => {
      setSelectedChoice(null);
      if (isCorrect) {
        setUnlockedPieces((prev) => new Set([...prev, pieceIdx]));
        setXp((x) => x + (attempts === 0 ? 30 : 15));
        goTo({ type: "unlock", pieceIdx });
      } else if (attempts >= 1) {
        // mercy rule after 2 attempts — show hint
        goTo({ type: "hint", pieceIdx });
      } else {
        goTo({ type: "question", pieceIdx, attempts: attempts + 1 });
      }
    }, 700);
  };

  const advancePiece = (pieceIdx: number) => {
    const nextIdx = pieceIdx + 1;
    if (nextIdx >= pieces.length) {
      setXp((x) => x + 50);
      goTo({ type: "ending" });
    } else {
      setCurrentPieceIdx(nextIdx);
      goTo({ type: "workshop" });
    }
  };

  useEffect(() => {
    if (phase.type === "ending" && !scoreSaved) {
      const pct = Math.min(100, Math.round((unlockedPieces.size / pieces.length) * 100));
      saveScore(studentId, game.id, pct);
      setScoreSaved(true);
    }
  }, [phase, scoreSaved, unlockedPieces.size, pieces.length, studentId, game.id]);

  const stars =
    unlockedPieces.size >= pieces.length
      ? 3
      : unlockedPieces.size >= Math.ceil(pieces.length * 0.6)
      ? 2
      : unlockedPieces.size > 0
      ? 1
      : 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#020f1f 0%,#0a1f3d 60%,#020f1f 100%)" }}
    >
      {/* XP indicator */}
      {phase.type !== "intro" && phase.type !== "ending" && (
        <div
          className="fixed top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold z-10"
          style={{ background: "rgba(0,0,0,0.5)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" }}
        >
          <Zap className="w-3.5 h-3.5" />
          {xp} XP
        </div>
      )}

      <div key={key} className="w-full max-w-md animate-fade-up">

        {/* ── INTRO ── */}
        {phase.type === "intro" && (
          <div className="text-center">
            <div className="text-8xl mb-5 drop-shadow-2xl">{config.buildEmoji}</div>
            <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight">
              {config.title}
            </h1>
            <div
              className="rounded-2xl p-5 mb-5 text-left"
              style={{ background: "rgba(2,15,30,0.85)", border: "1px solid rgba(56,189,248,0.2)" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "#bae6fd" }}>
                {config.narrative}
              </p>
            </div>
            <div
              className="rounded-xl px-4 py-3 mb-5"
              style={{ background: "rgba(2,15,30,0.85)", border: "1px solid rgba(56,189,248,0.12)" }}
            >
              <p className="text-xs" style={{ color: "rgba(56,189,248,0.7)" }}>
                🔧 {pieces.length} pièces à débloquer pour construire {config.buildTarget}
              </p>
            </div>
            {/* Locked pieces preview */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {pieces.map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(2,15,30,0.85)", border: "1px solid rgba(56,189,248,0.12)" }}
                >
                  🔒
                </div>
              ))}
            </div>
            <button
              onClick={() => { setCurrentPieceIdx(0); goTo({ type: "workshop" }); }}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "#38bdf8", color: "#000" }}
            >
              Commencer la construction <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── WORKSHOP ── */}
        {phase.type === "workshop" && (
          <div>
            <div
              className="rounded-2xl p-4 mb-5"
              style={{ background: "rgba(2,15,30,0.85)", border: "1px solid rgba(56,189,248,0.2)" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "rgba(56,189,248,0.55)" }}
              >
                Construction — {unlockedPieces.size} / {pieces.length} pièces
              </p>
              <div className="flex flex-wrap gap-2">
                {pieces.map((p, i) => {
                  const isUnlocked = unlockedPieces.has(i);
                  const isCurrent = i === currentPieceIdx;
                  return (
                    <div
                      key={i}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all"
                      style={{
                        background: isUnlocked
                          ? "rgba(56,189,248,0.12)"
                          : isCurrent
                          ? "rgba(56,189,248,0.06)"
                          : "rgba(2,15,30,0.6)",
                        border: isUnlocked
                          ? "1px solid rgba(56,189,248,0.45)"
                          : isCurrent
                          ? "2px dashed rgba(56,189,248,0.35)"
                          : "1px solid rgba(56,189,248,0.08)",
                        transform: isCurrent ? "scale(1.12)" : "scale(1)",
                      }}
                    >
                      {isUnlocked ? p.emoji : isCurrent ? "❓" : "🔒"}
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ background: "rgba(2,15,30,0.85)", border: "1px solid rgba(56,189,248,0.12)" }}
            >
              <p className="text-xs font-bold text-white mb-1">
                Pièce suivante : {pieces[currentPieceIdx]?.name}
              </p>
              <p className="text-xs" style={{ color: "#bae6fd" }}>
                Réponds correctement pour la débloquer.
              </p>
            </div>
            <button
              onClick={() => goTo({ type: "question", pieceIdx: currentPieceIdx, attempts: 0 })}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#38bdf8", color: "#000" }}
            >
              Débloquer la pièce <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── QUESTION ── */}
        {phase.type === "question" && (
          <div>
            <div className="text-center mb-3">
              <div className="text-3xl mb-1">🔒</div>
              <p className="text-xs font-bold text-white">{pieces[phase.pieceIdx]?.name}</p>
            </div>
            <div
              className="rounded-2xl p-5 mb-4"
              style={{ background: "rgba(2,15,30,0.85)", border: "1px solid rgba(56,189,248,0.2)" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "rgba(56,189,248,0.55)" }}
              >
                {phase.attempts > 0 ? "Réessaie !" : "Question"}
              </p>
              <p className="text-[15px] font-bold text-white leading-snug">
                {pieces[phase.pieceIdx]?.question}
              </p>
            </div>
            <div className="space-y-2">
              {pieces[phase.pieceIdx]?.choices.map((choice, i) => {
                const isSelected = selectedChoice === i;
                const isCorrect = i === pieces[phase.pieceIdx]?.correctIndex;
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(phase.pieceIdx, i, phase.attempts)}
                    disabled={selectedChoice !== null}
                    className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                    style={{
                      background: isSelected
                        ? isCorrect
                          ? "#16a34a"
                          : "#dc2626"
                        : "rgba(2,15,30,0.85)",
                      border: isSelected ? "none" : "1px solid rgba(56,189,248,0.15)",
                      color: isSelected ? "#fff" : "#bae6fd",
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8" }}
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

        {/* ── UNLOCK ── */}
        {phase.type === "unlock" && (
          <div className="text-center">
            <div className="text-7xl mb-4">{pieces[phase.pieceIdx]?.emoji}</div>
            <h3 className="text-xl font-extrabold text-white mb-2">
              {pieces[phase.pieceIdx]?.name} débloquée !
            </h3>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: "rgba(2,15,30,0.85)", border: "1px solid rgba(74,222,128,0.3)" }}
            >
              <p className="text-[13px] font-bold mb-1" style={{ color: "#4ade80" }}>
                +{currentPieceIdx === phase.pieceIdx ? 30 : 15} XP !
              </p>
              <p className="text-sm" style={{ color: "#bae6fd" }}>
                {pieces[phase.pieceIdx]?.unlockText}
              </p>
            </div>
            <button
              onClick={() => advancePiece(phase.pieceIdx)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#38bdf8", color: "#000" }}
            >
              {phase.pieceIdx + 1 < pieces.length ? "Pièce suivante" : "Terminer"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── HINT ── */}
        {phase.type === "hint" && (
          <div className="text-center">
            <div className="text-6xl mb-4">💡</div>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: "rgba(2,15,30,0.85)", border: "1px solid rgba(251,191,36,0.3)" }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "#fbbf24" }}
              >
                Indice
              </p>
              <p className="text-sm" style={{ color: "#bae6fd" }}>
                {pieces[phase.pieceIdx]?.hint}
              </p>
            </div>
            <button
              onClick={() => advancePiece(phase.pieceIdx)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#38bdf8", color: "#000" }}
            >
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ENDING ── */}
        {phase.type === "ending" && (
          <div className="text-center">
            <div className="text-8xl mb-4">{config.buildEmoji}</div>
            <h2 className="text-2xl font-extrabold text-white mb-3">
              {unlockedPieces.size >= pieces.length ? "Construction terminée !" : "Atelier terminé !"}
            </h2>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: "rgba(2,15,30,0.85)", border: "1px solid rgba(56,189,248,0.2)" }}
            >
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {pieces.map((p, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{
                      background: unlockedPieces.has(i)
                        ? "rgba(56,189,248,0.15)"
                        : "rgba(2,15,30,0.5)",
                      border: `1px solid ${unlockedPieces.has(i) ? "rgba(56,189,248,0.4)" : "rgba(56,189,248,0.08)"}`,
                    }}
                  >
                    {unlockedPieces.has(i) ? p.emoji : "🔒"}
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: "#bae6fd" }}>
                {config.completionText}
              </p>
            </div>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <div className="text-2xl font-extrabold" style={{ color: "#38bdf8" }}>
                  {xp}
                </div>
                <div className="text-xs text-white/50 mt-0.5">XP gagnés</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {unlockedPieces.size}/{pieces.length}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Pièces</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className="w-6 h-6"
                      style={{
                        color: s <= stars ? "#38bdf8" : "#ffffff30",
                        fill: s <= stars ? "#38bdf8" : "transparent",
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
              style={{ background: "#38bdf8", color: "#000" }}
            >
              Retour aux jeux
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
