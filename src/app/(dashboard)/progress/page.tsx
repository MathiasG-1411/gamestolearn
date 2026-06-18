import Link from "next/link";
import { BarChart2, Users, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GAME_TYPE_ICON: Record<string, string> = {
  "image-click": "🎯",
  memory: "🧠",
  quiz: "⏱️",
  anagram: "🔤",
};

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const { classId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // All teacher's classes
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("teacher_id", user!.id)
    .order("name");

  const selectedClass = classes?.find((c) => c.id === classId) ?? classes?.[0];

  if (!classes || classes.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] mb-8">
          Progression des élèves
        </h1>
        <div
          className="text-center py-20 bg-white rounded-[20px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#14B8A6]/10 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-8 h-8 text-[#14B8A6]" />
          </div>
          <p className="font-bold text-[#0F172A] text-lg mb-2">Aucune classe</p>
          <p className="text-[#475569] text-sm mb-6">
            Créez d&apos;abord une classe pour voir la progression.
          </p>
          <Link
            href="/classes"
            className="text-[#2563EB] hover:text-[#1D4ED8] text-sm font-medium transition-colors"
          >
            Gérer les classes →
          </Link>
        </div>
      </div>
    );
  }

  // Students in selected class
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name")
    .eq("class_id", selectedClass!.id)
    .order("first_name");

  // All games + all progress for these students (admin to bypass RLS)
  const admin = createAdminClient();
  const { data: games } = await admin
    .from("games")
    .select("id, title, type")
    .order("created_at", { ascending: false });

  const studentIds = (students ?? []).map((s) => s.id);
  const { data: progress } =
    studentIds.length > 0
      ? await admin
          .from("progress")
          .select("student_id, game_id, score, played_at")
          .in("student_id", studentIds)
      : { data: [] };

  // Build lookup: [studentId][gameId] → best score
  const scoreMap: Record<string, Record<string, number>> = {};
  for (const row of progress ?? []) {
    if (!scoreMap[row.student_id]) scoreMap[row.student_id] = {};
    const existing = scoreMap[row.student_id][row.game_id];
    if (existing === undefined || row.score > existing) {
      scoreMap[row.student_id][row.game_id] = row.score;
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F172A]">
          Progression des élèves
        </h1>
      </div>

      {/* Class tabs */}
      <div className="flex gap-2 flex-wrap mb-6 bg-gray-50 rounded-2xl p-1.5 w-fit">
        {classes.map((cls) => (
          <Link
            key={cls.id}
            href={`/progress?classId=${cls.id}`}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              cls.id === selectedClass!.id
                ? "bg-white text-[#2563EB] shadow-sm"
                : "text-[#475569] hover:text-[#0F172A]"
            }`}
          >
            {cls.name}
          </Link>
        ))}
      </div>

      {!students || students.length === 0 ? (
        <div
          className="text-center py-16 bg-white rounded-[20px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <p className="font-bold text-[#0F172A] mb-1">
            Aucun élève dans cette classe
          </p>
          <Link
            href={`/classes/${selectedClass!.id}`}
            className="text-[#2563EB] hover:text-[#1D4ED8] text-sm font-medium"
          >
            Ajouter des élèves →
          </Link>
        </div>
      ) : !games || games.length === 0 ? (
        <div
          className="text-center py-16 bg-white rounded-[20px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Play className="w-7 h-7 text-gray-400" />
          </div>
          <p className="font-bold text-[#0F172A] mb-1">Aucun jeu créé</p>
          <Link
            href="/games/new"
            className="text-[#2563EB] hover:text-[#1D4ED8] text-sm font-medium"
          >
            Créer un jeu →
          </Link>
        </div>
      ) : (
        <div
          className="overflow-x-auto bg-white rounded-[20px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-[#0F172A] sticky left-0 bg-white min-w-[140px]">
                  Élève
                </th>
                {games.map((game) => (
                  <th
                    key={game.id}
                    className="px-4 py-4 font-semibold text-center min-w-[120px] text-[#0F172A]"
                  >
                    <span className="mr-1">{GAME_TYPE_ICON[game.type] ?? "🎮"}</span>
                    <span className="text-xs font-normal text-[#475569] block mt-0.5 max-w-[100px] truncate mx-auto">
                      {game.title}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-4 font-semibold text-center min-w-[80px] text-[#0F172A]">
                  Jeux joués
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => {
                const studentScores = scoreMap[student.id] ?? {};
                const gamesPlayed = Object.keys(studentScores).length;
                return (
                  <tr
                    key={student.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-6 py-3.5 font-semibold text-[#0F172A] sticky left-0 bg-inherit">
                      {student.first_name}
                    </td>
                    {games.map((game) => {
                      const score = studentScores[game.id];
                      return (
                        <td key={game.id} className="px-4 py-3.5 text-center">
                          {score !== undefined ? (
                            <span className="inline-flex items-center justify-center bg-[#14B8A6]/10 text-[#14B8A6] font-semibold rounded-lg px-2.5 py-1 text-xs">
                              {score} pt{score !== 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          gamesPlayed === 0
                            ? "bg-gray-100 text-[#475569]"
                            : gamesPlayed === games.length
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#FBBF24]/10 text-amber-700"
                        }`}
                      >
                        {gamesPlayed}/{games.length}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
