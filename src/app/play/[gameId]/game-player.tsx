"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveScore } from "./actions";
import type { Json } from "@/types/database";

type Choice = {
  label: string;
  emoji?: string;
  imageUrl?: string;
  isCorrect: boolean;
};

type Round = {
  instruction: string;
  choices: Choice[];
};

type Game = {
  id: string;
  title: string;
  config: Json;
};

export default function GamePlayer({
  game,
  studentId,
}: {
  game: Game;
  studentId: string;
}) {
  const router = useRouter();
  const rounds = (game.config as { rounds: Round[] }).rounds;

  const [currentRound, setCurrentRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const round = rounds[currentRound];

  function handleChoice(index: number) {
    if (selected !== null) return;
    setSelected(index);

    const isCorrect = round.choices[index].isCorrect;
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    setTimeout(async () => {
      if (currentRound + 1 >= rounds.length) {
        await saveScore(studentId, game.id, newScore);
        setFinished(true);
      } else {
        setCurrentRound((r) => r + 1);
        setSelected(null);
      }
    }, 1000);
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
        <div className="text-6xl">
          {score === rounds.length ? "🎉" : score >= rounds.length / 2 ? "👍" : "💪"}
        </div>
        <h1 className="text-3xl font-bold">Terminé !</h1>
        <p className="text-2xl text-muted-foreground">
          {score} / {rounds.length} bonnes réponses
        </p>
        <Button onClick={() => router.push("/student/home")}>
          Retour aux jeux
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 gap-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {rounds.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < currentRound
                  ? "bg-primary"
                  : i === currentRound
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Instruction */}
        <h2 className="text-2xl font-bold text-center mb-8">
          {round.instruction}
        </h2>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-4">
          {round.choices.map((choice, i) => {
            let borderColor = "border-border";
            let bgColor = "";

            if (selected !== null) {
              if (choice.isCorrect) {
                borderColor = "border-green-500";
                bgColor = "bg-green-50 dark:bg-green-950";
              } else if (i === selected) {
                borderColor = "border-red-500";
                bgColor = "bg-red-50 dark:bg-red-950";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleChoice(i)}
                disabled={selected !== null}
                className={`border-2 ${borderColor} ${bgColor} rounded-xl p-6 flex flex-col items-center gap-3 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:cursor-default cursor-pointer`}
              >
                {choice.emoji && (
                  <span className="text-5xl">{choice.emoji}</span>
                )}
                {choice.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={choice.imageUrl}
                    alt={choice.label}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <span className="font-medium text-sm">{choice.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
