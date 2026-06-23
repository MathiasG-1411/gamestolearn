"use client";

import { useState, useRef } from "react";
import { ChevronRight, ChevronLeft, Star } from "lucide-react";
import { saveScore } from "../actions";

// ── Types ────────────────────────────────────────────────────────────

type QcmChallenge = {
  type: "qcm";
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

type TexteChallenge = {
  type: "texte";
  question: string;
  answer: string;         // expected answer (case-insensitive, accent-tolerant)
  placeholder?: string;
  explanation: string;
  tolerance?: boolean;    // true = ignore accents
};

type OrdreChallenge = {
  type: "ordre";
  question: string;
  items: string[];        // items in correct order
  explanation: string;
};

type TriChallenge = {
  type: "tri";
  question: string;
  categories: string[];   // category labels
  items: { label: string; categoryIndex: number }[];
  explanation: string;
};

type ZoneChallenge = QcmChallenge | TexteChallenge | OrdreChallenge | TriChallenge;

type Zone = {
  id: string;
  label: string;
  emoji: string;
  description?: string;
  challenge: ZoneChallenge;
};

type HubConfig = {
  title: string;
  intro: string;
  mapEmoji?: string;
  theme?: "foret" | "espace" | "chateau" | "mer" | "ville";
  zones: Zone[];
  ending: { text: string; emoji: string };
};

// ── Themes ───────────────────────────────────────────────────────────

const THEMES = {
  foret: { bg: "linear-gradient(180deg,#0d2b0d 0%,#1a3d1a 100%)", accent: "#4ade80", text: "#bbf7d0", card: "rgba(0,25,0,0.72)", border: "#4ade8030" },
  espace: { bg: "linear-gradient(180deg,#020210 0%,#0a0a2e 100%)", accent: "#818cf8", text: "#c7d2fe", card: "rgba(2,2,25,0.78)", border: "#818cf830" },
  chateau: { bg: "linear-gradient(180deg,#1c0f00 0%,#2d1a00 100%)", accent: "#fbbf24", text: "#fde68a", card: "rgba(25,12,0,0.78)", border: "#fbbf2430" },
  mer: { bg: "linear-gradient(180deg,#031328 0%,#0a1f3d 100%)", accent: "#38bdf8", text: "#bae6fd", card: "rgba(3,19,40,0.78)", border: "#38bdf830" },
  ville: { bg: "linear-gradient(180deg,#0f0f1a 0%,#1a1a2e 100%)", accent: "#f472b6", text: "#fce7f3", card: "rgba(12,12,20,0.78)", border: "#f472b630" },
};

// ── Helpers ──────────────────────────────────────────────────────────

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "").trim();

// ── Challenge renderers ───────────────────────────────────────────────

function QcmView({
  challenge,
  theme,
  onResult,
}: {
  challenge: QcmChallenge;
  theme: typeof THEMES.foret;
  onResult: (correct: boolean, firstTry: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleChoice = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    setAttempts((a) => a + 1);
    const correct = i === challenge.correctIndex;
    setTimeout(() => onResult(correct, attempts === 0 && correct), 700);
  };

  return (
    <div className="space-y-2">
      {challenge.choices.map((choice, i) => {
        const isSel = selected === i;
        const isCorr = i === challenge.correctIndex;
        return (
          <button key={i} onClick={() => handleChoice(i)} disabled={selected !== null}
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
  );
}

function TexteView({
  challenge,
  theme,
  onResult,
}: {
  challenge: TexteChallenge;
  theme: typeof THEMES.foret;
  onResult: (correct: boolean, firstTry: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const check = () => {
    if (!value.trim()) return;
    const expected = challenge.tolerance !== false ? normalize(challenge.answer) : challenge.answer.toLowerCase().trim();
    const given = challenge.tolerance !== false ? normalize(value) : value.toLowerCase().trim();
    const correct = given === expected;
    const firstTry = attempts === 0;
    setAttempts((a) => a + 1);
    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      setTimeout(() => onResult(true, firstTry), 600);
    }
    if (!correct && attempts >= 1) {
      setTimeout(() => onResult(false, false), 600);
    }
  };

  return (
    <div>
      <div className={`flex gap-2 ${shake ? "animate-shake" : ""}`}>
        <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder={challenge.placeholder ?? "Ta réponse…"}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2"
          style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, caretColor: theme.accent }}
          autoFocus
        />
        <button onClick={check} className="px-4 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: theme.accent, color: "#000" }}>
          OK
        </button>
      </div>
      {attempts > 0 && (
        <p className="text-xs mt-2 text-red-300">
          {attempts === 1 ? "Pas tout à fait… réessaie." : `La réponse attendue : « ${challenge.answer} »`}
        </p>
      )}
    </div>
  );
}

function OrdreView({
  challenge,
  theme,
  onResult,
}: {
  challenge: OrdreChallenge;
  theme: typeof THEMES.foret;
  onResult: (correct: boolean, firstTry: boolean) => void;
}) {
  const [order, setOrder] = useState<string[]>(() => [...challenge.items].sort(() => Math.random() - 0.5));
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...order];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const check = () => {
    const correct = order.every((item, i) => item === challenge.items[i]);
    const firstTry = attempts === 0;
    setAttempts((a) => a + 1);
    setSubmitted(true);
    setTimeout(() => onResult(correct, firstTry && correct), 800);
  };

  return (
    <div>
      <div className="space-y-2 mb-4">
        {order.map((item, i) => (
          <div key={item} className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold w-5 text-center shrink-0" style={{ color: `${theme.accent}99` }}>{i + 1}</span>
            <div className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
              {item}
            </div>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} disabled={i === 0 || submitted} className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80 disabled:opacity-30" style={{ background: `${theme.accent}25` }}>
                <span className="text-xs" style={{ color: theme.accent }}>▲</span>
              </button>
              <button onClick={() => move(i, 1)} disabled={i === order.length - 1 || submitted} className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80 disabled:opacity-30" style={{ background: `${theme.accent}25` }}>
                <span className="text-xs" style={{ color: theme.accent }}>▼</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={check} disabled={submitted} className="w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-50" style={{ background: theme.accent, color: "#000" }}>
        Valider l&apos;ordre
      </button>
    </div>
  );
}

function TriView({
  challenge,
  theme,
  onResult,
}: {
  challenge: TriChallenge;
  theme: typeof THEMES.foret;
  onResult: (correct: boolean, firstTry: boolean) => void;
}) {
  const [assignments, setAssignments] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(challenge.items.map((it) => [it.label, null]))
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const unassigned = challenge.items.filter((it) => assignments[it.label] === null).map((it) => it.label);

  const handleItemClick = (label: string) => {
    if (submitted) return;
    setSelected(label === selected ? null : label);
  };

  const handleCategoryClick = (catIdx: number) => {
    if (!selected || submitted) return;
    setAssignments((prev) => ({ ...prev, [selected]: catIdx }));
    setSelected(null);
  };

  const handleRemove = (label: string) => {
    if (submitted) return;
    setAssignments((prev) => ({ ...prev, [label]: null }));
  };

  const allAssigned = unassigned.length === 0;

  const check = () => {
    if (!allAssigned) return;
    const correct = challenge.items.every((it) => assignments[it.label] === it.categoryIndex);
    const firstTry = attempts === 0;
    setAttempts((a) => a + 1);
    setSubmitted(true);
    setTimeout(() => onResult(correct, firstTry && correct), 900);
  };

  return (
    <div>
      {/* Unassigned items */}
      {unassigned.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: `${theme.text}66` }}>Éléments à classer</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((label) => (
              <button key={label} onClick={() => handleItemClick(label)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: selected === label ? theme.accent : theme.card,
                  color: selected === label ? "#000" : theme.text,
                  border: `1px solid ${selected === label ? theme.accent : theme.border}`,
                  transform: selected === label ? "scale(1.05)" : "scale(1)",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3 mb-4">
        {challenge.categories.map((cat, catIdx) => {
          const items = challenge.items.filter((it) => assignments[it.label] === catIdx);
          return (
            <div key={catIdx}>
              <button onClick={() => handleCategoryClick(catIdx)} disabled={!selected || submitted}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: selected ? `${theme.accent}20` : theme.card,
                  border: `2px dashed ${selected ? theme.accent : theme.border}`,
                }}>
                <p className="text-xs font-bold mb-2" style={{ color: theme.accent }}>{cat}</p>
                <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                  {items.map((it) => (
                    <button key={it.label} onClick={(e) => { e.stopPropagation(); handleRemove(it.label); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: `${theme.accent}30`, color: theme.text, border: `1px solid ${theme.accent}50` }}>
                      {it.label} ×
                    </button>
                  ))}
                  {items.length === 0 && (
                    <span className="text-[11px]" style={{ color: `${theme.text}44` }}>
                      {selected ? "Cliquer pour placer ici" : "—"}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={check} disabled={!allAssigned || submitted}
        className="w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-40"
        style={{ background: theme.accent, color: "#000" }}>
        {allAssigned ? "Valider le classement" : `Encore ${unassigned.length} élément${unassigned.length > 1 ? "s" : ""} à placer`}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export default function HubGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config = game.config as HubConfig;
  const theme = THEMES[config.theme ?? "mer"] ?? THEMES.mer;

  const [phase, setPhase] = useState<"hub" | "challenge" | "feedback" | "ending">("hub");
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [errors, setErrors] = useState<{ label: string; question: string; correctAnswer: string }[]>([]);

  const activeZone = config.zones.find((z) => z.id === activeZoneId) ?? null;
  const total = config.zones.length;

  const goTo = (p: typeof phase) => {
    setAnimKey((k) => k + 1);
    setPhase(p);
  };

  const getCorrectDisplay = (challenge: ZoneChallenge): string => {
    if (challenge.type === "qcm") return challenge.choices[challenge.correctIndex];
    if (challenge.type === "texte") return challenge.answer;
    if (challenge.type === "ordre") return challenge.items.join(" → ");
    return challenge.items.map((it) => `${it.label} → ${challenge.categories[it.categoryIndex]}`).join(" | ");
  };

  const handleResult = (correct: boolean, firstTry: boolean) => {
    setLastCorrect(correct);
    if (!correct && activeZone) {
      setErrors((prev) => [
        ...prev,
        { label: activeZone.label, question: activeZone.challenge.question, correctAnswer: getCorrectDisplay(activeZone.challenge) },
      ]);
    }
    if (correct) {
      if (firstTry) setFirstTryCount((n) => n + 1);
      const newCompleted = new Set(completed);
      newCompleted.add(activeZoneId!);
      setCompleted(newCompleted);
      if (newCompleted.size === total && !scoreSaved) {
        const pct = Math.round((firstTryCount + (firstTry ? 1 : 0)) / total * 100);
        saveScore(studentId, game.id, pct);
        setScoreSaved(true);
      }
    }
    goTo("feedback");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{ background: theme.bg }}>

      {/* Progress bar */}
      {phase !== "ending" && (
        <div className="fixed top-0 left-0 right-0 h-1 z-20" style={{ background: `${theme.card}` }}>
          <div className="h-full transition-all duration-700" style={{ width: `${(completed.size / total) * 100}%`, background: theme.accent }} />
        </div>
      )}

      <div key={animKey} className="w-full max-w-md animate-fade-up">

        {/* ── HUB ── */}
        {phase === "hub" && (
          <div>
            <div className="text-center mb-6">
              <div className="text-7xl mb-3">{config.mapEmoji ?? "🗺️"}</div>
              <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">{config.title}</h1>
              <p className="text-sm" style={{ color: theme.text }}>{config.intro}</p>
              <p className="text-xs mt-2 font-semibold" style={{ color: `${theme.accent}99` }}>
                {completed.size}/{total} zones explorées
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {config.zones.map((zone) => {
                const done = completed.has(zone.id);
                return (
                  <button key={zone.id}
                    onClick={() => { setActiveZoneId(zone.id); goTo("challenge"); }}
                    className="rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      background: done ? `${theme.accent}20` : theme.card,
                      border: `2px solid ${done ? theme.accent : theme.border}`,
                    }}>
                    <div className="text-3xl mb-2">{done ? "✅" : zone.emoji}</div>
                    <p className="text-sm font-bold text-white leading-tight">{zone.label}</p>
                    {zone.description && (
                      <p className="text-[11px] mt-0.5 leading-tight" style={{ color: `${theme.text}99` }}>{zone.description}</p>
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-2" style={{ color: done ? theme.accent : `${theme.text}55` }}>
                      {done ? "Terminé ✓" : `${zone.challenge.type.toUpperCase()}`}
                    </p>
                  </button>
                );
              })}
            </div>

            {completed.size === total && (
              <button onClick={() => goTo("ending")}
                className="w-full mt-5 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition hover:opacity-90"
                style={{ background: theme.accent, color: "#000" }}>
                Terminer la mission 🏆 <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ── CHALLENGE ── */}
        {phase === "challenge" && activeZone && (
          <div>
            <button onClick={() => goTo("hub")} className="flex items-center gap-1.5 mb-5 text-xs font-semibold transition hover:opacity-70" style={{ color: theme.text }}>
              <ChevronLeft className="w-3.5 h-3.5" /> Retour à la carte
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{activeZone.emoji}</span>
              <div>
                <p className="font-extrabold text-white text-[15px]">{activeZone.label}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${theme.accent}99` }}>
                  {activeZone.challenge.type === "qcm" ? "Choix multiple" : activeZone.challenge.type === "texte" ? "Saisie libre" : activeZone.challenge.type === "ordre" ? "Remets en ordre" : "Classement"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <p className="text-[15px] font-bold text-white leading-snug">{activeZone.challenge.question}</p>
            </div>

            {activeZone.challenge.type === "qcm" && (
              <QcmView challenge={activeZone.challenge} theme={theme} onResult={handleResult} />
            )}
            {activeZone.challenge.type === "texte" && (
              <TexteView challenge={activeZone.challenge} theme={theme} onResult={handleResult} />
            )}
            {activeZone.challenge.type === "ordre" && (
              <OrdreView challenge={activeZone.challenge} theme={theme} onResult={handleResult} />
            )}
            {activeZone.challenge.type === "tri" && (
              <TriView challenge={activeZone.challenge} theme={theme} onResult={handleResult} />
            )}
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {phase === "feedback" && activeZone && (
          <div className="text-center">
            <div className="text-6xl mb-4">{lastCorrect ? "✅" : "❌"}</div>
            <div className="rounded-2xl p-5 mb-5 text-left" style={{ background: theme.card, border: `1px solid ${lastCorrect ? "#4ade8045" : "#f8717145"}` }}>
              <p className="text-[13px] font-bold mb-2" style={{ color: lastCorrect ? "#4ade80" : "#fca5a5" }}>
                {lastCorrect ? "Bonne réponse !" : "Pas tout à fait…"}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                {activeZone.challenge.explanation}
              </p>
            </div>
            <button onClick={() => goTo("hub")}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition hover:opacity-90"
              style={{ background: theme.accent, color: "#000" }}>
              Retour à la carte <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ENDING ── */}
        {phase === "ending" && (
          <div className="text-center">
            <div className="text-8xl mb-4">{config.ending.emoji}</div>
            <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Mission accomplie !</h2>
            <div className="rounded-2xl p-5 mb-5 text-left" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{config.ending.text}</p>
            </div>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <div className="text-2xl font-extrabold text-white">{firstTryCount}/{total}</div>
                <div className="text-xs text-white/50 mt-0.5">Premier coup</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map((s) => {
                    const lit = s <= Math.ceil((firstTryCount / Math.max(total, 1)) * 3);
                    return <Star key={s} className="w-6 h-6" style={{ color: lit ? theme.accent : "#ffffff30", fill: lit ? theme.accent : "transparent" }} />;
                  })}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Étoiles</div>
              </div>
            </div>
            {errors.length > 0 && (
              <div className="rounded-2xl p-4 mb-5 text-left" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: `${theme.accent}99` }}>
                  📝 À revoir ({errors.length})
                </p>
                <div className="space-y-3">
                  {errors.map((err, i) => (
                    <div key={i} className="text-left pt-2.5 first:pt-0" style={{ borderTop: i > 0 ? `1px solid ${theme.border}` : "none" }}>
                      <p className="text-[11px] font-bold mb-0.5" style={{ color: theme.accent }}>{err.label}</p>
                      <p className="text-xs mb-1 leading-snug" style={{ color: `${theme.text}88` }}>{err.question}</p>
                      <p className="text-xs font-semibold" style={{ color: theme.text }}>✓ {err.correctAnswer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <a href="/student/home" className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition hover:opacity-90" style={{ background: theme.accent, color: "#000" }}>
              Retour aux jeux
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
