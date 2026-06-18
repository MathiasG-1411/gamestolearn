export const dynamic = "force-dynamic";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookOpen, Target, Brain, Puzzle, MessageSquare, Image, HelpCircle } from "lucide-react";
import type { Json } from "@/types/database";

const GAME_TYPE_META: Record<string, { icon: React.ElementType; label: string; color: string; bg: string; border: string }> = {
  quiz: { icon: HelpCircle, label: "Quiz", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  memory: { icon: Brain, label: "Memory", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  escape: { icon: Puzzle, label: "Escape", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  anagram: { icon: MessageSquare, label: "Anagramme", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  "image-click": { icon: Image, label: "Image", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  aventure: { icon: BookOpen, label: "Aventure", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  mission: { icon: Target, label: "Mission", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
};

function itemCount(type: string, c: Json): string {
  if (type === "quiz") return `${(c as { questions?: unknown[] })?.questions?.length ?? 0} questions`;
  if (type === "memory") return `${(c as { pairs?: unknown[] })?.pairs?.length ?? 0} paires`;
  if (type === "escape") return `${(c as { questions?: unknown[] })?.questions?.length ?? 0} questions`;
  if (type === "anagram") return `${(c as { words?: unknown[] })?.words?.length ?? 0} mots`;
  if (type === "aventure") {
    const chapters = (c as { chapters?: unknown[] })?.chapters ?? [];
    const main = chapters.filter((ch: unknown) => {
      const c2 = ch as { wrongNext?: string; id?: string };
      return c2.wrongNext !== c2.id;
    });
    return `${main.length} chapitres`;
  }
  if (type === "mission") return `${(c as { phases?: unknown[] })?.phases?.length ?? 0} phases`;
  return "";
}

export default async function GamesPage() {
  const supabase = createAdminClient();
  const { data: games } = await supabase.from("games").select("id, title, type, config, created_at").order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Mes jeux</h1>
          <p className="text-[#64748B] text-sm mt-1">{games?.length ?? 0} jeux créés</p>
        </div>
        <Link
          href="/dashboard/games/new"
          className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
        >
          + Nouveau jeu
        </Link>
      </div>

      {!games || games.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[#E2E8F0] rounded-2xl">
          <p className="text-[#64748B] text-sm">Aucun jeu pour l&apos;instant.</p>
          <Link href="/dashboard/games/new" className="text-[#2563EB] text-sm font-medium mt-2 inline-block hover:underline">
            Créer votre premier jeu →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {games.map((game) => {
            const meta = GAME_TYPE_META[game.type] ?? { icon: HelpCircle, label: game.type, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" };
            const Icon = meta.icon;
            return (
              <div
                key={game.id}
                style={{ borderColor: meta.border, background: "#fff" }}
                className="border rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div style={{ background: meta.bg, color: meta.color }} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#0F172A] truncate">{game.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ color: meta.color, background: meta.bg }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">{itemCount(game.type, game.config)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
