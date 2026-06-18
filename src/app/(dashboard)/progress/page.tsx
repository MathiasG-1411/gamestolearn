import Link from "next/link";
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
  const { data: { user } } = await supabase.auth.getUser();

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
        <h1 className="text-2xl font-bold mb-8">Progression des élèves</h1>
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <div className="text-5xl mb-4">🏫</div>
          <p className="font-semibold text-lg mb-2">Aucune classe</p>
          <p className="text-muted-foreground text-sm mb-6">
            Créez d&apos;abord une classe pour voir la progression.
          </p>
          <Link
            href="/classes"
            className="text-primary hover:underline text-sm font-medium"
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
  const { data: progress } = studentIds.length > 0
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Progression des élèves</h1>
      </div>

      {/* Class tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {classes.map((cls) => (
          <Link
            key={cls.id}
            href={`/progress?classId=${cls.id}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              cls.id === selectedClass!.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {cls.name}
          </Link>
        ))}
      </div>

      {!students || students.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-semibold mb-1">Aucun élève dans cette classe</p>
          <Link
            href={`/classes/${selectedClass!.id}`}
            className="text-primary hover:underline text-sm"
          >
            Ajouter des élèves →
          </Link>
        </div>
      ) : !games || games.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <div className="text-4xl mb-3">🎮</div>
          <p className="font-semibold mb-1">Aucun jeu créé</p>
          <Link href="/games/new" className="text-primary hover:underline text-sm">
            Créer un jeu →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium sticky left-0 bg-muted/50 min-w-[140px]">
                  Élève
                </th>
                {games.map((game) => (
                  <th key={game.id} className="px-4 py-3 font-medium text-center min-w-[120px]">
                    <span className="mr-1">{GAME_TYPE_ICON[game.type] ?? "🎮"}</span>
                    <span className="text-xs font-normal text-muted-foreground block mt-0.5 max-w-[100px] truncate mx-auto">
                      {game.title}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 font-medium text-center min-w-[80px]">
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
                    className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                  >
                    <td className="px-4 py-3 font-medium sticky left-0 bg-inherit">
                      {student.first_name}
                    </td>
                    {games.map((game) => {
                      const score = studentScores[game.id];
                      return (
                        <td key={game.id} className="px-4 py-3 text-center">
                          {score !== undefined ? (
                            <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-lg px-2 py-1 text-xs">
                              {score} pt{score !== 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs font-semibold ${
                          gamesPlayed === 0
                            ? "text-muted-foreground"
                            : gamesPlayed === games.length
                            ? "text-green-600"
                            : "text-amber-600"
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
