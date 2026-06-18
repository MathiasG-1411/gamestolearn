import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { studentLogout } from "../actions";

const GAME_COLORS = [
  "from-indigo-500 to-violet-600",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-600",
  "from-sky-400 to-blue-600",
];

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

  const className = (student.classes as { name: string } | null)?.name ?? "ta classe";

  const { data: games } = await supabase
    .from("games")
    .select("id, title, type")
    .order("created_at");

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-600 to-violet-700">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 text-center relative">
        <form action={studentLogout} className="absolute top-6 right-6">
          <button type="submit" className="text-indigo-200 hover:text-white text-xs transition-colors">
            Changer →
          </button>
        </form>
        <div className="text-5xl mb-3">👋</div>
        <h1 className="text-3xl font-extrabold text-white mb-1">
          Salut {student.first_name} !
        </h1>
        <p className="text-indigo-200 text-sm">{className}</p>
      </div>

      {/* Games */}
      <div className="bg-white rounded-t-3xl min-h-screen px-6 pt-8 pb-16">
        <h2 className="text-xl font-extrabold mb-5 text-gray-800">Mes jeux 🎮</h2>

        {games && games.length > 0 ? (
          <div className="flex flex-col gap-4">
            {games.map((game, i) => (
              <Link
                key={game.id}
                href={`/play/${game.id}`}
                className={`bg-gradient-to-r ${GAME_COLORS[i % GAME_COLORS.length]} rounded-2xl p-5 flex items-center gap-4 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="text-4xl">🎯</div>
                <div className="flex-1">
                  <p className="font-extrabold text-white text-lg">{game.title}</p>
                  <p className="text-white/80 text-sm">Appuie pour jouer !</p>
                </div>
                <span className="text-white text-2xl">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⏳</div>
            <p className="font-bold text-gray-700 mb-1">Pas encore de jeux...</p>
            <p className="text-sm text-gray-400">
              Ton enseignant va bientôt en ajouter !
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
