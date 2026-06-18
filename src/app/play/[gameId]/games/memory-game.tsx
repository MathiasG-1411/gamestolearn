"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveScore } from "../actions";

type Pair = { id: string; word: string; emoji: string };

type Card = {
  id: string;
  pairId: string;
  content: string;
  type: "emoji" | "word";
  isFlipped: boolean;
  isMatched: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function MemoryGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const router = useRouter();
  const { pairs } = game.config as { pairs: Pair[] };

  const [cards, setCards] = useState<Card[]>(() =>
    shuffle(
      pairs.flatMap((p) => [
        { id: `${p.id}-emoji`, pairId: p.id, content: p.emoji, type: "emoji" as const, isFlipped: false, isMatched: false },
        { id: `${p.id}-word`, pairId: p.id, content: p.word, type: "word" as const, isFlipped: false, isMatched: false },
      ])
    )
  );

  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);
  const [locked, setLocked] = useState(false);

  const matchedCount = cards.filter((c) => c.isMatched).length / 2;

  useEffect(() => {
    if (flippedIds.length !== 2) return;
    setLocked(true);

    const [a, b] = flippedIds.map((id) => cards.find((c) => c.id === id)!);
    if (a.pairId === b.pairId) {
      setCards((prev) =>
        prev.map((c) =>
          c.pairId === a.pairId ? { ...c, isMatched: true } : c
        )
      );
      setFlippedIds([]);
      setLocked(false);
    } else {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            flippedIds.includes(c.id) ? { ...c, isFlipped: false } : c
          )
        );
        setFlippedIds([]);
        setLocked(false);
      }, 1000);
    }
  }, [flippedIds, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      const score = Math.max(pairs.length, pairs.length * 2 - (moves - pairs.length));
      saveScore(studentId, game.id, Math.min(score, pairs.length * 2)).then(() =>
        setFinished(true)
      );
    }
  }, [cards, moves, pairs.length, studentId, game.id]);

  function flip(id: string) {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched || flippedIds.length >= 2) return;

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
    );
    setFlippedIds((prev) => {
      const next = [...prev, id];
      if (prev.length === 0) setMoves((m) => m + 1);
      return next;
    });
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold">Bravo !</h1>
        <p className="text-xl text-muted-foreground">
          {pairs.length} paires trouvées en {moves} coups
        </p>
        <Button onClick={() => router.push("/student/home")}>Retour aux jeux</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 gap-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{game.title}</h2>
          <span className="text-sm text-muted-foreground">
            {matchedCount}/{pairs.length} paires · {moves} coups
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              className={`aspect-square rounded-xl border-2 flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                card.isMatched
                  ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700"
                  : card.isFlipped
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted cursor-pointer hover:border-primary/50"
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <span className={card.type === "emoji" ? "text-3xl" : "text-xs text-center px-1"}>
                  {card.content}
                </span>
              ) : (
                <span className="text-2xl">❓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
