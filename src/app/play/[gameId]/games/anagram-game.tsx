"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveScore } from "../actions";

type WordEntry = { word: string; hint: string; emoji: string };

function shuffleLetters(word: string): string[] {
  const letters = word.toUpperCase().split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // make sure it's not already solved
  if (letters.join("") === word.toUpperCase() && letters.length > 1) {
    [letters[0], letters[1]] = [letters[1], letters[0]];
  }
  return letters;
}

export default function AnagramGame({
  game,
  studentId,
}: {
  game: { id: string; title: string; config: unknown };
  studentId: string;
}) {
  const router = useRouter();
  const { words } = game.config as { words: WordEntry[] };

  const [current, setCurrent] = useState(0);
  const [letters, setLetters] = useState<string[]>(() => shuffleLetters(words[0].word));
  const [answer, setAnswer] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const wordEntry = words[current];

  function pickLetter(i: number) {
    if (feedback !== null) return;
    const letter = letters[i];
    setLetters((prev) => prev.filter((_, idx) => idx !== i));
    setAnswer((prev) => [...prev, letter]);
  }

  function removeLetter(i: number) {
    if (feedback !== null) return;
    const letter = answer[i];
    setAnswer((prev) => prev.filter((_, idx) => idx !== i));
    setLetters((prev) => [...prev, letter]);
  }

  function checkAnswer() {
    const isCorrect =
      answer.join("").toUpperCase() === wordEntry.word.toUpperCase();
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(async () => {
      if (current + 1 >= words.length) {
        await saveScore(studentId, game.id, newScore);
        setFinished(true);
      } else {
        setCurrent((c) => c + 1);
        setLetters(shuffleLetters(words[current + 1].word));
        setAnswer([]);
        setFeedback(null);
      }
    }, 1200);
  }

  function reset() {
    setLetters(shuffleLetters(wordEntry.word));
    setAnswer([]);
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
        <div className="text-6xl">
          {score === words.length ? "🎉" : score >= words.length / 2 ? "👍" : "💪"}
        </div>
        <h1 className="text-3xl font-bold">Terminé !</h1>
        <p className="text-2xl text-muted-foreground">
          {score} / {words.length} mots trouvés
        </p>
        <Button onClick={() => router.push("/student/home")}>Retour aux jeux</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 gap-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {words.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < current ? "bg-primary" : i === current ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="text-center mb-8">
          <div className="text-6xl mb-3">{wordEntry.emoji}</div>
          <p className="text-muted-foreground text-sm">{wordEntry.hint}</p>
        </div>

        {/* Answer slots */}
        <div className="flex justify-center gap-2 mb-6 min-h-[56px]">
          {answer.length === 0 ? (
            <div className="flex items-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl px-6 py-3">
              Clique sur les lettres ci-dessous
            </div>
          ) : (
            answer.map((letter, i) => (
              <button
                key={i}
                onClick={() => removeLetter(i)}
                className={`w-12 h-14 rounded-xl border-2 font-bold text-lg transition-all ${
                  feedback === "correct"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : feedback === "wrong"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-primary bg-primary/10 hover:bg-primary/20"
                }`}
              >
                {letter}
              </button>
            ))
          )}
        </div>

        {/* Scrambled letters */}
        <div className="flex justify-center flex-wrap gap-2 mb-8">
          {letters.map((letter, i) => (
            <button
              key={i}
              onClick={() => pickLetter(i)}
              className="w-12 h-14 rounded-xl border-2 border-border bg-background font-bold text-lg hover:border-primary hover:bg-primary/5 transition-all"
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="flex-1">
            Recommencer
          </Button>
          <Button
            onClick={checkAnswer}
            disabled={answer.length !== wordEntry.word.length || feedback !== null}
            className="flex-1"
          >
            Valider ✓
          </Button>
        </div>
      </div>
    </div>
  );
}
