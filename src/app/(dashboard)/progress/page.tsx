import Link from "next/link";
import { BarChart2, Users, Play, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GAME_TYPE_ICON: Record<string, string> = {
  "image-click": "🎯",
  memory: "🧠",
  quiz: "⏱️",
  anagram: "🔤",
  escape: "🔐",
  enquete: "🔍",
};

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const { classId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("teacher_id", user!.id)
    .order("name");

  const selectedClass = classes?.find((c) => c.id === classId) ?? classes?.[0];

  if (!classes || classes.length === 0) {
    return (
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-8">Progression des élèves</h1>
        <div
          className="text-center py-16 bg-white rounded-2xl"
          style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F0FDFA] flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-7 h-7 text-[#14B8A6]" />
          </div>
          <p className="font-semibold text-[#0F172A] text-[15px] mb-1">Aucune classe</p>
          <p className="text-[13px] text-[#94A3B8] mb-5">Créez d&apos;abord une classe pour voir la progression.</p>
          <Link href="/classes" className="text-[13px] text-[#2563EB] font-medium hover:underline">
            Gérer les classes →
          </Link>
        </div>
      </div>
    );
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, first_name")
    .eq("class_id", selectedClass!.id)
    .order("first_name");

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

  const scoreMap: Record<string, Record<string, number>> = {};
  for (const row of progress ?? []) {
    if (!scoreMap[row.student_id]) scoreMap[row.student_id] = {};
    const existing = scoreMap[row.student_id][row.game_id];
    if (existing === undefined || row.score > existing) {
      scoreMap[row.student_id][row.game_id] = row.score;
    }
  }

  const totalGames = games?.length ?? 0;
  const studentsWithScores = studentIds.filter(
    (id) => Object.keys(scoreMap[id] ?? {}).length > 0
  ).length;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Progression des élèves</h1>
        <p className="text-[13px] text-[#94A3B8] mt-0.5">{selectedClass?.name}</p>
      </div>

      {/* Summary stats */}
      {students && students.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Élèves",
              value: students.length,
              icon: Users,
              color: "#2563EB",
              bg: "#EFF6FF",
            },
            {
              label: "Jeux disponibles",
              value: totalGames,
              icon: Play,
              color: "#F59E0B",
              bg: "#FFFBEB",
            },
            {
              label: "Ont joué",
              value: studentsWithScores,
              icon: TrendingUp,
              color: "#14B8A6",
              bg: "#F0FDFA",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-4 flex items-center gap-3"
              style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: stat.bg }}>
                <stat.icon style={{ color: stat.color, width: "18px", height: "18px" }} />
              </div>
              <div>
                <div className="text-xl font-bold text-[#0F172A] leading-none">{stat.value}</div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Class tabs */}
      <div className="flex gap-1.5 flex-wrap bg-[#F8FAFC] rounded-xl p-1 w-fit border border-[#F1F5F9]">
        {classes.map((cls) => (
          <Link
            key={cls.id}
            href={`/progress?classId=${cls.id}`}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
              cls.id === selectedClass!.id
                ? "bg-white text-[#2563EB] shadow-sm border border-[#F1F5F9]"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {cls.name}
          </Link>
        ))}
      </div>

      {!students || students.length === 0 ? (
        <div
          className="text-center py-14 bg-white rounded-2xl"
          style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-[#CBD5E1]" />
          </div>
          <p className="font-semibold text-[#0F172A] text-[14px] mb-1">Aucun élève dans cette classe</p>
          <Link href={`/classes/${selectedClass!.id}`} className="text-[13px] text-[#2563EB] font-medium hover:underline">
            Ajouter des élèves →
          </Link>
        </div>
      ) : !games || games.length === 0 ? (
        <div
          className="text-center py-14 bg-white rounded-2xl"
          style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
            <Play className="w-6 h-6 text-[#CBD5E1]" />
          </div>
          <p className="font-semibold text-[#0F172A] text-[14px] mb-1">Aucun jeu créé</p>
          <Link href="/games/new" className="text-[13px] text-[#2563EB] font-medium hover:underline">
            Créer un jeu →
          </Link>
        </div>
      ) : (
        <div
          className="overflow-x-auto bg-white rounded-2xl"
          style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #F8FAFC" }}>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider sticky left-0 bg-white min-w-[140px]">
                  Élève
                </th>
                {games.map((game) => (
                  <th
                    key={game.id}
                    className="px-4 py-3.5 text-center min-w-[110px]"
                  >
                    <div className="text-base leading-none mb-0.5">{GAME_TYPE_ICON[game.type] ?? "🎮"}</div>
                    <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider max-w-[90px] truncate mx-auto">
                      {game.title}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-center min-w-[80px] text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Taux
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => {
                const studentScores = scoreMap[student.id] ?? {};
                const gamesPlayed = Object.keys(studentScores).length;
                const rate = totalGames > 0 ? Math.round((gamesPlayed / totalGames) * 100) : 0;
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                    style={i < students.length - 1 ? { borderBottom: "1px solid #F8FAFC" } : {}}
                  >
                    <td className="px-5 py-3 sticky left-0 bg-inherit">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[10px] font-bold text-[#2563EB] shrink-0">
                          {student.first_name[0]?.toUpperCase()}
                        </div>
                        <span className="text-[13px] font-semibold text-[#0F172A]">{student.first_name}</span>
                      </div>
                    </td>
                    {games.map((game) => {
                      const score = studentScores[game.id];
                      return (
                        <td key={game.id} className="px-4 py-3 text-center">
                          {score !== undefined ? (
                            <span
                              className="inline-flex items-center justify-center font-semibold rounded-lg px-2.5 py-1 text-[11px]"
                              style={{
                                background: score >= 80 ? "#ECFDF5" : score >= 50 ? "#FFFBEB" : "#FEF2F2",
                                color: score >= 80 ? "#059669" : score >= 50 ? "#D97706" : "#DC2626",
                              }}
                            >
                              {score}%
                            </span>
                          ) : (
                            <span className="text-[#E2E8F0] text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{
                          background: rate === 100 ? "#ECFDF5" : rate > 0 ? "#FFFBEB" : "#F8FAFC",
                          color: rate === 100 ? "#059669" : rate > 0 ? "#D97706" : "#CBD5E1",
                        }}
                      >
                        {rate}%
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
