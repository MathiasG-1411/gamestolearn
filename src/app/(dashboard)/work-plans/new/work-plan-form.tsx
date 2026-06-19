"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronUp, ChevronDown, Check } from "lucide-react";
import { createWorkPlan } from "./actions";

type Game = { id: string; title: string; type: string };
type ClassItem = { id: string; name: string };

const GAME_ICONS: Record<string, string> = {
  "image-click": "🎯",
  memory: "🧠",
  quiz: "⏱️",
  anagram: "🔤",
  escape: "🔐",
  enquete: "🔍",
  aventure: "📖",
  mission: "🎖️",
  plateau: "🎲",
  cartes: "🃏",
  defi: "⚡",
  construction: "🔧",
};

export default function WorkPlanForm({
  games,
  classes,
}: {
  games: Game[];
  classes: ClassItem[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const addGame = (gameId: string) => {
    if (!selectedGameIds.includes(gameId)) {
      setSelectedGameIds((prev) => [...prev, gameId]);
    }
  };

  const removeGame = (gameId: string) => {
    setSelectedGameIds((prev) => prev.filter((id) => id !== gameId));
  };

  const moveGame = (index: number, direction: "up" | "down") => {
    const newIds = [...selectedGameIds];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newIds.length) return;
    [newIds[index], newIds[swapIdx]] = [newIds[swapIdx], newIds[index]];
    setSelectedGameIds(newIds);
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Titre requis"); return; }
    if (selectedGameIds.length === 0) { setError("Sélectionnez au moins un jeu"); return; }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("gameIds", JSON.stringify(selectedGameIds));
    formData.append("classIds", JSON.stringify(selectedClassIds));

    const result = await createWorkPlan(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/work-plans");
  };

  const selectedGames = selectedGameIds
    .map((id) => games.find((g) => g.id === id))
    .filter(Boolean) as Game[];

  const availableGames = games.filter((g) => !selectedGameIds.includes(g.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">
          Titre du plan
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex : Semaine des fractions"
          className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">
          Description{" "}
          <span className="font-normal text-[#94A3B8]">(facultatif)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Instructions ou contexte pour les élèves..."
          rows={2}
          className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none"
        />
      </div>

      {/* Game sequence */}
      <div>
        <label className="text-[13px] font-semibold text-[#0F172A] mb-3 block">
          Séquence de jeux{" "}
          <span className="font-normal text-[#94A3B8]">
            — {selectedGameIds.length} sélectionné{selectedGameIds.length !== 1 ? "s" : ""}
          </span>
        </label>

        {/* Selected games with reorder */}
        {selectedGames.length > 0 && (
          <div
            className="mb-4 rounded-xl overflow-hidden"
            style={{ border: "1px solid #E2E8F0" }}
          >
            {selectedGames.map((game, i) => (
              <div
                key={game.id}
                className="flex items-center gap-3 px-4 py-3 bg-white"
                style={
                  i < selectedGames.length - 1
                    ? { borderBottom: "1px solid #F1F5F9" }
                    : {}
                }
              >
                <span
                  className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
                >
                  {i + 1}
                </span>
                <span className="text-lg">{GAME_ICONS[game.type] ?? "🎮"}</span>
                <span className="flex-1 text-[13px] font-medium text-[#0F172A] truncate">
                  {game.title}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveGame(i, "up")}
                    disabled={i === 0}
                    className="p-1 rounded-lg hover:bg-[#F8FAFC] disabled:opacity-25 transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGame(i, "down")}
                    disabled={i === selectedGames.length - 1}
                    className="p-1 rounded-lg hover:bg-[#F8FAFC] disabled:opacity-25 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeGame(game.id)}
                    className="p-1 ml-1 rounded-lg hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available games chips */}
        {availableGames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableGames.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => addGame(game.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm"
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  color: "#475569",
                }}
              >
                <span>{GAME_ICONS[game.type] ?? "🎮"}</span>
                {game.title}
                <Plus className="w-3 h-3 text-[#94A3B8]" />
              </button>
            ))}
          </div>
        ) : games.length === 0 ? (
          <p className="text-[13px] text-[#94A3B8] py-2">
            Aucun jeu disponible.{" "}
            <a href="/games/new" className="text-[#2563EB] hover:underline">
              Créez d&apos;abord un jeu →
            </a>
          </p>
        ) : (
          <p className="text-[13px] text-[#94A3B8] py-2">
            Tous les jeux ont été ajoutés.
          </p>
        )}
      </div>

      {/* Class assignment */}
      {classes.length > 0 && (
        <div>
          <label className="text-[13px] font-semibold text-[#0F172A] mb-3 block">
            Assigner à des classes{" "}
            <span className="font-normal text-[#94A3B8]">(facultatif)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {classes.map((cls) => {
              const selected = selectedClassIds.includes(cls.id);
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => toggleClass(cls.id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                  style={{
                    background: selected ? "#EFF6FF" : "#F8FAFC",
                    border: `1px solid ${selected ? "#BFDBFE" : "#E2E8F0"}`,
                    color: selected ? "#2563EB" : "#64748B",
                  }}
                >
                  {selected && <Check className="w-3 h-3" />}
                  {cls.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 h-10 px-6 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-sm disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
        >
          {loading ? "Sauvegarde..." : "Créer le plan"}
        </button>
        <a
          href="/work-plans"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all"
          style={{ border: "1px solid #E2E8F0" }}
        >
          Annuler
        </a>
      </div>
    </form>
  );
}
