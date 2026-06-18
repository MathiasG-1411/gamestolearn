"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createGame } from "./actions";

type Choice = { emoji: string; label: string; isCorrect: boolean };
type Round = { instruction: string; choices: Choice[] };

const EMPTY_ROUND = (): Round => ({
  instruction: "",
  choices: [
    { emoji: "", label: "", isCorrect: true },
    { emoji: "", label: "", isCorrect: false },
    { emoji: "", label: "", isCorrect: false },
    { emoji: "", label: "", isCorrect: false },
  ],
});

export default function GameForm({ error }: { error?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [rounds, setRounds] = useState<Round[]>([EMPTY_ROUND()]);

  function updateRound(ri: number, field: string, value: string) {
    setRounds((prev) =>
      prev.map((r, i) => (i === ri ? { ...r, [field]: value } : r))
    );
  }

  function updateChoice(ri: number, ci: number, field: keyof Choice, value: string | boolean) {
    setRounds((prev) =>
      prev.map((r, i) => {
        if (i !== ri) return r;
        return {
          ...r,
          choices: r.choices.map((c, j) => {
            if (field === "isCorrect") {
              return { ...c, isCorrect: j === ci };
            }
            return j === ci ? { ...c, [field]: value } : c;
          }),
        };
      })
    );
  }

  function addRound() {
    setRounds((prev) => [...prev, EMPTY_ROUND()]);
  }

  function removeRound(ri: number) {
    setRounds((prev) => prev.filter((_, i) => i !== ri));
  }

  return (
    <form ref={formRef} action={createGame}>
      <input type="hidden" name="rounds" value={JSON.stringify(rounds)} />

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl mb-6 text-center">
          {decodeURIComponent(error)}
        </div>
      )}

      {/* Title */}
      <div className="bg-background border border-border rounded-2xl p-6 mb-6">
        <label className="text-sm font-semibold mb-2 block">Titre du jeu</label>
        <input
          name="title"
          type="text"
          required
          placeholder="ex : Les animaux, Les couleurs, L'alphabet..."
          className="w-full border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Rounds */}
      <div className="flex flex-col gap-6 mb-6">
        {rounds.map((round, ri) => (
          <div key={ri} className="bg-background border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">
                Round {ri + 1}
              </h3>
              {rounds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRound(ri)}
                  className="text-xs text-destructive hover:text-destructive/80"
                >
                  Supprimer
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Instruction (ex : &quot;Clique sur le CHAT&quot;)
              </label>
              <input
                type="text"
                required
                value={round.instruction}
                onChange={(e) => updateRound(ri, "instruction", e.target.value)}
                placeholder="Clique sur le..."
                className="w-full border border-input rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {round.choices.map((choice, ci) => (
                <div
                  key={ci}
                  className={`border-2 rounded-xl p-3 transition-colors ${
                    choice.isCorrect ? "border-green-500 bg-green-50" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name={`correct-${ri}`}
                      checked={choice.isCorrect}
                      onChange={() => updateChoice(ri, ci, "isCorrect", true)}
                      className="accent-green-500"
                    />
                    <span className="text-xs text-muted-foreground">
                      {choice.isCorrect ? "✅ Correct" : "Incorrecte"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={choice.emoji}
                    onChange={(e) => updateChoice(ri, ci, "emoji", e.target.value)}
                    placeholder="🐱"
                    className="w-full text-2xl text-center border border-input rounded-lg py-1 mb-2 focus:outline-none focus:ring-1 focus:ring-ring"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={choice.label}
                    onChange={(e) => updateChoice(ri, ci, "label", e.target.value)}
                    placeholder="Label"
                    className="w-full border border-input rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addRound} className="flex-1">
          + Ajouter un round
        </Button>
        <Button type="submit" className="flex-1">
          Enregistrer le jeu 💾
        </Button>
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Annuler
      </button>
    </form>
  );
}
