import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { studentLogout } from "../actions";

const GAME_COLORS = [
  { from: "#2563EB", to: "#7C3AED" },
  { from: "#FBBF24", to: "#F97316" },
  { from: "#14B8A6", to: "#059669" },
  { from: "#EC4899", to: "#EF4444" },
  { from: "#38BDF8", to: "#2563EB" },
];

const GAME_TYPE_ICONS: Record<string, string> = {
  "image-click": "🎯",
  memory: "🧠",
  quiz: "⏱️",
  anagram: "🔤",
};

export default async function StudentHomePage() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_id")?.value;
  if (!studentId) redirect("/student");

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, first_name, class_id, classes(name)")
    .eq("id", studentId)
    .single();

  if (!student) redirect("/student");

  const className =
    (student.classes as { name: string } | null)?.name ?? "ta classe";

  const { data: games } = await supabase
    .from("games")
    .select("id, title, type")
    .order("created_at");

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F97316 50%, #EC4899 100%)" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-8 text-center relative">
        <form action={studentLogout} className="absolute top-6 right-6">
          <button
            type="submit"
            className="text-white/70 hover:text-white text-xs font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl"
          >
            Changer →
          </button>
        </form>
        <div className="text-6xl mb-4">👋</div>
        <h1 className="text-3xl font-extrabold text-white mb-1 drop-shadow-sm">
          Salut {student.first_name} !
        </h1>
        <p className="text-white/80 text-sm font-medium">{className}</p>
      </div>

      {/* Games panel */}
      <div className="bg-white rounded-t-[32px] min-h-screen px-6 pt-8 pb-20">
        <h2 className="text-xl font-extrabold mb-6 text-[#0F172A]">
          Mes jeux 🎮
        </h2>

        {games && games.length > 0 ? (
          <div className="flex flex-col gap-4">
            {games.map((game, i) => {
              const colors = GAME_COLORS[i % GAME_COLORS.length];
              const icon = GAME_TYPE_ICONS[game.type] ?? "🎯";
              return (
                <Link
                  key={game.id}
                  href={`/play/${game.id}`}
                  className="rounded-[20px] p-5 flex items-center gap-4 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-white text-lg leading-tight truncate">
                      {game.title}
                    </p>
                    <p className="text-white/80 text-sm mt-0.5">
                      Appuie pour jouer !
                    </p>
                  </div>
                  <span className="text-white text-2xl shrink-0">→</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⏳</div>
            <p className="font-bold text-[#0F172A] mb-1">
              Pas encore de jeux...
            </p>
            <p className="text-sm text-[#475569]">
              Ton enseignant va bientôt en ajouter !
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
