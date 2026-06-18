import Link from "next/link";
import { Plus, Trash2, Brain, Timer, Puzzle, Target, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { deleteGame } from "./actions";

type GameTypeMeta = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bg: string;
};

const GAME_TYPE_META: Record<string, GameTypeMeta> = {
  "image-click": { icon: Target, label: "Clique sur l'image", color: "text-[#2563EB]", bg: "bg-[#2563EB]/10" },
  memory: { icon: Brain, label: "Memory", color: "text-[#14B8A6]", bg: "bg-[#14B8A6]/10" },
  quiz: { icon: Timer, label: "Quiz chronométré", color: "text-[#FBBF24]", bg: "bg-[#FBBF24]/10" },
  anagram: { icon: Puzzle, label: "Anagramme", color: "text-purple-600", bg: "bg-purple-50" },
};

function itemCount(config: unknown, type: string): string {
  const c = config as Record<string, unknown[]>;
  if (type === "image-click") return `${(c?.rounds ?? []).length} rounds`;
  if (type === "memory") return `${(c?.pairs ?? []).length} paires`;
  if (type === "quiz") return `${(c?.questions ?? []).length} questions`;
  if (type === "anagram") return `${(c?.words ?? []).length} mots`;
  return "";
}

export default async function GamesPage() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("id, title, type, config, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Mes jeux</h1>
          <p className="text-[#475569] text-sm mt-1">
            {(games?.length ?? 0)} jeu{(games?.length ?? 0) !== 1 ? "x" : ""} créé{(games?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link href="/games/new">
            <Plus className="w-4 h-4" />
            Créer un jeu
          </Link>
        </Button>
      </div>

      {games && games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => {
            const meta = GAME_TYPE_META[game.type] ?? {
              icon: Play,
              label: game.type,
              color: "text-gray-500",
              bg: "bg-gray-100",
            };
            const GameIcon = meta.icon;
            return (
              <div
                key={game.id}
                className="bg-white rounded-[20px] p-6 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${meta.bg} flex items-center justify-center shrink-0`}>
                    <GameIcon className={`w-6 h-6 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#0F172A] text-base leading-tight mb-0.5 truncate">
                      {game.title}
                    </h3>
                    <p className="text-xs text-[#475569]">
                      {itemCount(game.config, game.type)} · {meta.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-xs text-[#475569]">
                    {new Date(game.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <form action={deleteGame}>
                    <input type="hidden" name="gameId" value={game.id} />
                    <Button
                      variant="destructive"
                      size="sm"
                      type="submit"
                      className="flex items-center gap-1 h-7 text-xs px-2.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="text-center py-20 bg-white rounded-[20px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#FBBF24]/10 flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-[#FBBF24]" />
          </div>
          <p className="font-bold text-[#0F172A] text-lg mb-2">
            Aucun jeu pour l&apos;instant
          </p>
          <p className="text-[#475569] text-sm mb-6">
            Créez votre premier jeu pédagogique !
          </p>
          <Button asChild className="flex items-center gap-2 mx-auto">
            <Link href="/games/new">
              <Plus className="w-4 h-4" />
              Créer un jeu
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
