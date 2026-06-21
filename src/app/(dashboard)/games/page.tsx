import Link from "next/link";
import { Plus, Trash2, Brain, Timer, Puzzle, Target, Lock, Search, Play, Gamepad2, BookOpen, Crosshair, Dices, Layers, Zap, Wrench, Compass, Map } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteGame } from "./actions";

type GameTypeMeta = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  color: string;
  bg: string;
  border: string;
};

const GAME_TYPE_META: Record<string, GameTypeMeta> = {
  hub: { icon: Map, label: "Hub interactif", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  quete: { icon: Compass, label: "Quête", color: "#9333EA", bg: "#FAF5FF", border: "#E9D5FF" },
  "image-click": { icon: Target, label: "Clique & trouve", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  memory: { icon: Brain, label: "Memory", color: "#14B8A6", bg: "#F0FDFA", border: "#99F6E4" },
  quiz: { icon: Timer, label: "Quiz chronométré", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  anagram: { icon: Puzzle, label: "Anagramme", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  escape: { icon: Lock, label: "Escape Game", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  enquete: { icon: Search, label: "Enquête", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  aventure: { icon: BookOpen, label: "Aventure", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  mission: { icon: Crosshair, label: "Mission", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  plateau: { icon: Dices, label: "Plateau", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  cartes: { icon: Layers, label: "Cartes RPG", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  defi: { icon: Zap, label: "Défi chrono", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
  construction: { icon: Wrench, label: "Construction", color: "#0369A1", bg: "#EFF6FF", border: "#BFDBFE" },
};

function itemCount(config: unknown, type: string): string {
  const c = config as Record<string, unknown[]>;
  if (type === "image-click") return `${(c?.rounds ?? []).length} rounds`;
  if (type === "memory") return `${(c?.pairs ?? []).length} paires`;
  if (type === "quiz") return `${(c?.questions ?? []).length} questions`;
  if (type === "anagram") return `${(c?.words ?? []).length} mots`;
  if (type === "escape") return `${(c?.questions ?? []).length} énigmes`;
  if (type === "enquete") return `${(c?.questions ?? []).length} indices`;
  if (type === "aventure") return `${(c?.chapters ?? []).length} chapitres`;
  if (type === "mission") return `${(c?.phases ?? []).length} phases`;
  if (type === "plateau") return `${(c?.spaces ?? []).length} cases`;
  if (type === "cartes") return `${(c?.cards ?? []).length} cartes`;
  if (type === "defi") return `${(c?.challenges ?? []).length} défis`;
  if (type === "construction") return `${(c?.pieces ?? []).length} pièces`;
  if (type === "quete") return `${(c?.rooms ?? []).length} salles`;
  if (type === "hub") return `${(c?.zones ?? []).length} zones`;
  return "";
}

export default async function GamesPage() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("id, title, type, config, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Mes jeux</h1>
          <p className="text-[13px] text-[#94A3B8] mt-0.5">
            {(games?.length ?? 0)} jeu{(games?.length ?? 0) !== 1 ? "x" : ""} créé{(games?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/games/new"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-sm"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Créer un jeu
        </Link>
      </div>

      {games && games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {games.map((game, i) => {
            const meta = GAME_TYPE_META[game.type] ?? {
              icon: Play,
              label: game.type,
              color: "#64748B",
              bg: "#F8FAFC",
              border: "#E2E8F0",
            };
            const GameIcon = meta.icon;
            return (
              <div
                key={game.id}
                className="group bg-white rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
                style={{
                  border: "1px solid #F1F5F9",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
                  animationDelay: `${i * 50}ms`,
                }}
              >
                {/* Card header with type color accent */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: meta.bg }}
                    >
                      <GameIcon className="w-5 h-5" style={{ color: meta.color }} />
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#0F172A] text-[15px] leading-tight mb-1 pr-2">
                    {game.title}
                  </h3>
                  <p className="text-[12px] text-[#94A3B8]">{itemCount(game.config, game.type)}</p>
                </div>

                {/* Card footer */}
                <div
                  className="flex items-center justify-between px-5 py-3 gap-2"
                  style={{ borderTop: "1px solid #F8FAFC", background: "#FAFAFA" }}
                >
                  <Link
                    href={`/play/${game.id}?preview=true`}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: meta.color, background: meta.bg }}
                  >
                    <Play className="w-3 h-3" />
                    Tester
                  </Link>
                  <form action={deleteGame}>
                    <input type="hidden" name="gameId" value={game.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-[11px] font-medium text-[#94A3B8] hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="text-center py-16 bg-white rounded-2xl"
          style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FFFBEB] flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-7 h-7 text-[#F59E0B]" />
          </div>
          <p className="font-semibold text-[#0F172A] text-[15px] mb-1">Aucun jeu pour l&apos;instant</p>
          <p className="text-[13px] text-[#94A3B8] mb-5">Créez votre premier jeu pédagogique.</p>
          <Link
            href="/games/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Créer un jeu
          </Link>
        </div>
      )}
    </div>
  );
}
