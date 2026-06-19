"use client";

import { useState, useEffect } from "react";
import { Zap, ChevronRight, Star } from "lucide-react";
import { saveScore } from "../actions";

type Card = {
  id: string;
  name: string;
  emoji: string;
  type: "attack" | "defense" | "special";
  question: string;
  choices: string[];
  correctIndex: number;
  power: number;
  description: string;
  wrongPenalty: number;
};

type CartesConfig = {
  title: string;
  narrative: string;
  setting: string; // emoji backdrop
  playerName: string;
  playerEmoji: string;
  enemyName: string;
  enemyEmoji: string;
  playerMaxHP: number;
  enemyMaxHP: number;
  cards: Card[];
};

type Phase =
  | { type: "intro" }
  | { type: "hand"; handCards: string[] }
  | { type: "question"; cardId: string; handCards: string[] }
  | { type: "result"; cardId: string; correct: boolean; damage: number; penalty: number }
  | { type: "enemy_turn"; playerDamage: number; newPlayerHP: number }
  | { type: "ending"; victory: boolean };

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function HPBar({
  emoji,
  name,
  hp,
  maxHP,
  accent,
}: {
  emoji: string;
  name: string;
  hp: number;
  maxHP: number;
  accent: string;
}) {
  const pct = Math.max(0, Math.min(100, (hp / maxHP) * 100));
  const barColor = pct > 50 ? "#22c55e" : pct > 25 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-lg leading-none">{emoji}</span>
        <span
          className="text-xs font-bold truncate"
          style={{ color: accent }}
        >
          {name}
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <div className="text-[10px] text-white/50 mt-0.5">
        {hp}/{maxHP} HP
      </div>
    </div>
  );
}

export default function CartesGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const config = game.config as CartesConfig;

  const accent = "#a855f7";
  const cardBg = "rgba(20,0,40,0.85)";
  const cardBorder = "rgba(168,85,247,0.25)";
  const textColor = "#e9d5ff";

  const [phase, setPhase] = useState<Phase>({ type: "intro" });
  const [playerHP, setPlayerHP] = useState(config.playerMaxHP);
  const [enemyHP, setEnemyHP] = useState(config.enemyMaxHP);
  const [deck, setDeck] = useState<string[]>(() =>
    shuffle(config.cards.map((c) => c.id))
  );
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [key, setKey] = useState(0);

  const getCard = (id: string) => config.cards.find((c) => c.id === id);

  const goTo = (nextPhase: Phase) => {
    setKey((k) => k + 1);
    setPhase(nextPhase);
  };

  const startTurn = (remainingDeck: string[]) => {
    const handCards = remainingDeck.slice(0, 3);
    goTo({ type: "hand", handCards });
  };

  const handleSelectCard = (cardId: string, handCards: string[]) => {
    goTo({ type: "question", cardId, handCards });
  };

  const handleAnswer = (cardId: string, choiceIdx: number, handCards: string[]) => {
    if (selectedChoice !== null) return;
    const card = getCard(cardId);
    if (!card) return;

    setSelectedChoice(choiceIdx);
    const isCorrect = choiceIdx === card.correctIndex;

    let newEnemyHP = enemyHP;
    let newPlayerHP = playerHP;

    if (isCorrect) {
      newEnemyHP = Math.max(0, enemyHP - card.power);
      setEnemyHP(newEnemyHP);
    } else {
      newPlayerHP = Math.max(0, playerHP - card.wrongPenalty);
      setPlayerHP(newPlayerHP);
    }

    const newDeck = deck.filter((id) => id !== cardId);
    setDeck(newDeck);

    setTimeout(() => {
      setSelectedChoice(null);

      if (isCorrect && newEnemyHP <= 0) {
        goTo({ type: "ending", victory: true });
        return;
      }
      if (!isCorrect && newPlayerHP <= 0) {
        goTo({ type: "ending", victory: false });
        return;
      }

      goTo({
        type: "result",
        cardId,
        correct: isCorrect,
        damage: isCorrect ? card.power : 0,
        penalty: isCorrect ? 0 : card.wrongPenalty,
      });
    }, 700);
  };

  const handleResultContinue = () => {
    const enemyDamage = Math.floor(Math.random() * 11) + 5; // 5-15
    const newPlayerHP = Math.max(0, playerHP - enemyDamage);
    setPlayerHP(newPlayerHP);
    goTo({ type: "enemy_turn", playerDamage: enemyDamage, newPlayerHP });
  };

  const handleEnemyTurnEnd = (phaseState: { playerDamage: number; newPlayerHP: number }) => {
    if (phaseState.newPlayerHP <= 0) {
      goTo({ type: "ending", victory: false });
      return;
    }
    if (enemyHP <= 0) {
      goTo({ type: "ending", victory: true });
      return;
    }
    if (deck.length === 0) {
      goTo({ type: "ending", victory: true });
      return;
    }
    startTurn(deck);
  };

  const score = Math.min(
    100,
    Math.round(((config.enemyMaxHP - enemyHP) / config.enemyMaxHP) * 100)
  );

  useEffect(() => {
    if (phase.type === "ending" && !scoreSaved) {
      saveScore(studentId, game.id, score);
      setScoreSaved(true);
    }
  }, [phase, scoreSaved, score, studentId, game.id]);

  const showBattleHeader =
    phase.type !== "intro" && phase.type !== "ending";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg,#0d0015 0%,#1a0030 60%,#0d0015 100%)",
      }}
    >
      {/* Battle header */}
      {showBattleHeader && (
        <div
          className="fixed top-0 left-0 right-0 z-20 px-4 py-3 flex items-center gap-4"
          style={{
            background: "rgba(0,0,0,0.6)",
            borderBottom: "1px solid rgba(168,85,247,0.15)",
          }}
        >
          <HPBar
            emoji={config.playerEmoji}
            name={config.playerName}
            hp={playerHP}
            maxHP={config.playerMaxHP}
            accent={accent}
          />
          <span className="text-2xl shrink-0">⚔️</span>
          <HPBar
            emoji={config.enemyEmoji}
            name={config.enemyName}
            hp={enemyHP}
            maxHP={config.enemyMaxHP}
            accent="#f87171"
          />
        </div>
      )}

      <div
        key={key}
        className="w-full max-w-md animate-fade-up"
        style={{ marginTop: showBattleHeader ? "72px" : "0" }}
      >

        {/* ── INTRO ── */}
        {phase.type === "intro" && (
          <div className="text-center">
            <div className="text-8xl mb-3 drop-shadow-2xl">{config.setting}</div>
            <div className="flex items-center justify-center gap-4 mb-5">
              <span className="text-5xl">{config.playerEmoji}</span>
              <span className="text-3xl text-white/40">⚔️</span>
              <span className="text-5xl">{config.enemyEmoji}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight tracking-tight">
              {config.title}
            </h1>
            <div
              className="rounded-2xl p-5 mb-7 text-left"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <p className="text-sm leading-relaxed" style={{ color: textColor }}>
                {config.narrative}
              </p>
            </div>
            <button
              onClick={() => startTurn(deck)}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: accent, color: "#fff" }}
            >
              Au combat ! <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── HAND ── */}
        {phase.type === "hand" && (
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-4 text-center"
              style={{ color: `${accent}99` }}
            >
              Choisis une carte à jouer
            </p>
            <div className="space-y-3">
              {phase.handCards.map((cardId) => {
                const card = getCard(cardId);
                if (!card) return null;
                const typeLabel =
                  card.type === "attack"
                    ? "Attaque"
                    : card.type === "defense"
                    ? "Défense"
                    : "Spéciale";
                return (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card.id, phase.handCards)}
                    className="w-full text-left rounded-2xl p-4 transition-all hover:opacity-90 hover:-translate-y-0.5"
                    style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{card.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="font-bold text-sm text-white truncate"
                          >
                            {card.name}
                          </span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: `${accent}20`, color: accent }}
                          >
                            {typeLabel}
                          </span>
                        </div>
                        <p
                          className="text-xs leading-snug truncate"
                          style={{ color: `${textColor}80` }}
                        >
                          {card.description}
                        </p>
                      </div>
                      <div
                        className="shrink-0 text-right"
                        style={{ color: accent }}
                      >
                        <div className="text-lg font-extrabold">
                          <Zap className="w-3.5 h-3.5 inline -mt-0.5" />
                          {card.power}
                        </div>
                        <div className="text-[10px] text-white/40">Puissance</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p
              className="text-center text-xs mt-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {deck.length} carte{deck.length !== 1 ? "s" : ""} restante{deck.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* ── QUESTION ── */}
        {phase.type === "question" && (() => {
          const card = getCard(phase.cardId);
          if (!card) return null;
          return (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{card.emoji}</span>
                <div>
                  <p className="font-bold text-white">{card.name}</p>
                  <p className="text-xs" style={{ color: `${accent}99` }}>
                    Réponds correctement pour infliger {card.power} dégâts !
                  </p>
                </div>
              </div>
              <div
                className="rounded-2xl p-5 mb-4"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: `${accent}99` }}
                >
                  Question
                </p>
                <p className="text-[15px] font-bold text-white leading-snug">
                  {card.question}
                </p>
              </div>
              <div className="space-y-2">
                {card.choices.map((choice, i) => {
                  const isSelected = selectedChoice === i;
                  const isCorrect = i === card.correctIndex;
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        handleAnswer(phase.cardId, i, phase.handCards)
                      }
                      disabled={selectedChoice !== null}
                      className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                      style={{
                        background: isSelected
                          ? isCorrect
                            ? "#16a34a"
                            : "#dc2626"
                          : cardBg,
                        border: isSelected ? "none" : `1px solid ${cardBorder}`,
                        color: isSelected ? "#fff" : textColor,
                        transform: isSelected ? "scale(1.01)" : "",
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: `${accent}25`,
                          color: accent,
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

        {/* ── RESULT ── */}
        {phase.type === "result" && (() => {
          const card = getCard(phase.cardId);
          if (!card) return null;
          return (
            <div className="text-center">
              <div className="text-6xl mb-4">{phase.correct ? "💥" : "🛡️"}</div>
              <h2 className="text-xl font-extrabold text-white mb-3">
                {phase.correct
                  ? `${card.name} — ${phase.damage} dégâts infligés !`
                  : `Raté ! Tu encaisses ${phase.penalty} dégâts.`}
              </h2>
              <div
                className="rounded-2xl p-5 mb-5"
                style={{
                  background: cardBg,
                  border: `1px solid ${phase.correct ? "#4ade8045" : "#f8717145"}`,
                }}
              >
                <p className="text-sm" style={{ color: textColor }}>
                  {phase.correct
                    ? `Excellent ! Ta carte ${card.emoji} ${card.name} a frappé fort.`
                    : `Mauvaise réponse. ${config.enemyName} contre-attaque...`}
                </p>
              </div>
              <button
                onClick={handleResultContinue}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: accent, color: "#fff" }}
              >
                Tour de l&apos;ennemi <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* ── ENEMY TURN ── */}
        {phase.type === "enemy_turn" && (
          <div className="text-center">
            <div className="text-7xl mb-4">{config.enemyEmoji}</div>
            <h2 className="text-xl font-extrabold text-white mb-3">
              {config.enemyName} attaque !
            </h2>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <p className="text-sm" style={{ color: textColor }}>
                {config.enemyName} t&apos;inflige{" "}
                <span className="font-bold text-red-400">
                  {phase.playerDamage} dégâts
                </span>
                .{" "}
                {phase.newPlayerHP > 0
                  ? `Il te reste ${phase.newPlayerHP} HP. Tiens bon !`
                  : "Tu es à terre..."}
              </p>
            </div>
            <button
              onClick={() => handleEnemyTurnEnd(phase)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: accent, color: "#fff" }}
            >
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ENDING ── */}
        {phase.type === "ending" && (
          <div className="text-center">
            <div className="text-8xl mb-4">{phase.victory ? "🏆" : "💀"}</div>
            <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
              {phase.victory ? "Victoire !" : "Défaite..."}
            </h2>
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <p className="text-sm leading-relaxed" style={{ color: textColor }}>
                {phase.victory
                  ? `Bravo ! Tu as vaincu ${config.enemyName} et prouvé tes connaissances !`
                  : `${config.enemyName} a eu le dessus cette fois. Entraîne-toi et reviens plus fort !`}
              </p>
            </div>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <div className="text-2xl font-extrabold" style={{ color: accent }}>
                  {config.enemyMaxHP - enemyHP}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Dégâts infligés</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">{playerHP}</div>
                <div className="text-xs text-white/50 mt-0.5">HP restants</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map((s) => {
                    const lit = phase.victory
                      ? s <= (playerHP > config.playerMaxHP * 0.5 ? 3 : playerHP > config.playerMaxHP * 0.25 ? 2 : 1)
                      : false;
                    return (
                      <Star
                        key={s}
                        className="w-6 h-6"
                        style={{
                          color: lit ? accent : "#ffffff30",
                          fill: lit ? accent : "transparent",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Étoiles</div>
              </div>
            </div>
            <a
              href="/student/home"
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: accent, color: "#fff" }}
            >
              Retour aux jeux
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
