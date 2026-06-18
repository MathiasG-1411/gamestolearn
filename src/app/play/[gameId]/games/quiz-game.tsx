"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveScore } from "../actions";

type Question = {
  question: string;
  choices: string[];
  correctIndex: number;
};

export default function QuizGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const router = useRouter();
  const { questions, timePerQuestion = 20 } = game.config as {
    questions: Question[];
    timePerQuestion?: number;
  };

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [finished, setFinished] = useState(false);

  const question = questions[current];

  const advance = useCallback(
    async (picked: number | null) => {
      const correct = picked === question.correctIndex;
      const newScore = correct ? score + 1 : score;
      if (correct) setScore(newScore);

      if (current + 1 >= questions.length) {
        await saveScore(studentId, game.id, newScore);
        setFinished(true);
      } else {
        setTimeout(() => {
          setCurrent((c) => c + 1);
          setSelected(null);
          setTimeLeft(timePerQuestion);
        }, 1000);
      }
    },
    [current, question, score, questions.length, studentId, game.id, timePerQuestion]
  );

  useEffect(() => {
    if (selected !== null || finished) return;
    if (timeLeft <= 0) {
      setSelected(-1);
      advance(null);
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected, finished, advance]);

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    advance(i);
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
        <div className="text-6xl">
          {score === questions.length ? "🏆" : score >= questions.length / 2 ? "👍" : "💪"}
        </div>
        <h1 className="text-3xl font-bold">Terminé !</h1>
        <p className="text-2xl text-muted-foreground">
          {score} / {questions.length} bonnes réponses
        </p>
        <Button onClick={() => router.push("/student/home")}>Retour aux jeux</Button>
      </div>
    );
  }

  const timerPct = (timeLeft / timePerQuestion) * 100;
  const timerColor = timeLeft > 10 ? "bg-green-500" : timeLeft > 5 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex flex-col items-center min-h-screen p-6 gap-6">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-4">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < current ? "bg-primary" : i === current ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Timer bar */}
        <div className="h-3 bg-muted rounded-full mb-6 overflow-hidden">
          <div
            className={`h-full ${timerColor} rounded-full transition-all duration-1000`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        <div className="text-right text-sm font-mono text-muted-foreground mb-4">
          {timeLeft}s
        </div>

        <h2 className="text-xl font-bold text-center mb-8">{question.question}</h2>

        <div className="flex flex-col gap-3">
          {question.choices.map((choice, i) => {
            let variant = "border-border bg-background hover:border-primary/50";
            if (selected !== null) {
              if (i === question.correctIndex) variant = "border-green-500 bg-green-50 dark:bg-green-950";
              else if (i === selected) variant = "border-red-500 bg-red-50 dark:bg-red-950";
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={selected !== null}
                className={`border-2 ${variant} rounded-xl px-5 py-4 text-left font-medium transition-all duration-200 disabled:cursor-default`}
              >
                <span className="text-muted-foreground mr-3 font-mono text-sm">
                  {String.fromCharCode(65 + i)}.
                </span>
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
