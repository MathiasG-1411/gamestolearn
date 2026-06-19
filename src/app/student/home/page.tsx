import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { studentLogout } from "../actions";

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

const GAME_COLORS = [
  { from: "#2563EB", to: "#7C3AED" },
  { from: "#FBBF24", to: "#F97316" },
  { from: "#14B8A6", to: "#059669" },
  { from: "#EC4899", to: "#EF4444" },
  { from: "#38BDF8", to: "#2563EB" },
];

export default async function StudentHomePage() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_id")?.value;
  if (!studentId) redirect("/student");

  const admin = createAdminClient();

  const { data: student } = await admin
    .from("students")
    .select("id, first_name, class_id, classes(name)")
    .eq("id", studentId)
    .single();

  if (!student) redirect("/student");

  const className =
    (student.classes as { name: string } | null)?.name ?? "ta classe";
  const classId = student.class_id;

  // Work plans assigned to this student's class
  const { data: planAssignments } = await admin
    .from("work_plan_classes")
    .select("plan_id")
    .eq("class_id", classId);

  const planIds = (planAssignments ?? []).map(
    (a: { plan_id: string }) => a.plan_id
  );

  const { data: workPlans } =
    planIds.length > 0
      ? await admin
          .from("work_plans")
          .select("id, title, description, game_ids")
          .in("id", planIds)
          .order("created_at")
      : { data: [] };

  // Games referenced by plans
  const allPlanGameIds = [
    ...new Set(
      (workPlans ?? []).flatMap((p) => p.game_ids as string[])
    ),
  ];
  const { data: planGames } =
    allPlanGameIds.length > 0
      ? await admin
          .from("games")
          .select("id, title, type")
          .in("id", allPlanGameIds)
      : { data: [] };

  const planGamesById = Object.fromEntries(
    (planGames ?? []).map((g) => [g.id, g])
  );

  // All games (for "other games" section)
  const { data: allGames } = await admin
    .from("games")
    .select("id, title, type")
    .order("created_at");

  // Student's best scores per game
  const { data: progressRows } = await admin
    .from("progress")
    .select("game_id, score")
    .eq("student_id", studentId);

  const bestScores: Record<string, number> = {};
  for (const row of progressRows ?? []) {
    const existing = bestScores[row.game_id];
    if (existing === undefined || row.score > existing) {
      bestScores[row.game_id] = row.score;
    }
  }

  const planGameIdSet = new Set(allPlanGameIds);
  const otherGames = (allGames ?? []).filter((g) => !planGameIdSet.has(g.id));
  const hasPlans = (workPlans ?? []).length > 0;

  return (
    <main
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #FBBF24 0%, #F97316 50%, #EC4899 100%)",
      }}
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

      {/* Main panel */}
      <div className="bg-white rounded-t-[32px] min-h-screen px-6 pt-8 pb-20">
        {/* Work plans */}
        {hasPlans &&
          (workPlans ?? []).map((plan) => {
            const steps = (plan.game_ids as string[])
              .map((id) => planGamesById[id])
              .filter(Boolean);
            const completedCount = steps.filter(
              (g) => bestScores[g.id] !== undefined
            ).length;
            const progressPct =
              steps.length > 0
                ? Math.round((completedCount / steps.length) * 100)
                : 0;

            return (
              <div key={plan.id} className="mb-8">
                {/* Plan title + count */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-extrabold text-[#0F172A]">
                    📋 {plan.title}
                  </h2>
                  <span className="text-sm font-bold" style={{ color: "#F97316" }}>
                    {completedCount}/{steps.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className="h-2.5 rounded-full mb-4 overflow-hidden"
                  style={{ background: "#F1F5F9" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progressPct}%`,
                      background:
                        "linear-gradient(90deg, #FBBF24 0%, #F97316 100%)",
                    }}
                  />
                </div>

                {plan.description && (
                  <p className="text-sm text-[#64748B] mb-4">
                    {plan.description}
                  </p>
                )}

                {/* Steps */}
                <div className="flex flex-col gap-3">
                  {steps.map((game, i) => {
                    const done = bestScores[game.id] !== undefined;
                    const score = bestScores[game.id];
                    const isNext =
                      !done &&
                      steps
                        .slice(0, i)
                        .every((g) => bestScores[g.id] !== undefined);

                    return (
                      <Link
                        key={game.id}
                        href={`/play/${game.id}`}
                        className="rounded-[16px] p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                          background: done
                            ? "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
                            : isNext
                            ? "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)"
                            : "#F8FAFC",
                          border: `2px solid ${
                            done
                              ? "#A7F3D0"
                              : isNext
                              ? "#FDE68A"
                              : "#F1F5F9"
                          }`,
                          boxShadow: isNext
                            ? "0 4px 12px rgba(251,191,36,0.2)"
                            : "none",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                          style={{
                            background: done
                              ? "#10B981"
                              : isNext
                              ? "#F97316"
                              : "#E2E8F0",
                          }}
                        >
                          {done ? "✓" : GAME_ICONS[game.type] ?? "🎮"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{
                                color: done
                                  ? "#10B981"
                                  : isNext
                                  ? "#F97316"
                                  : "#94A3B8",
                              }}
                            >
                              Étape {i + 1}
                            </span>
                            {done && score !== undefined && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: "#ECFDF5",
                                  color: "#10B981",
                                }}
                              >
                                {score}%
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-[#0F172A] text-[15px] leading-tight truncate">
                            {game.title}
                          </p>
                        </div>
                        <span
                          className="text-xl shrink-0"
                          style={{
                            color: done
                              ? "#10B981"
                              : isNext
                              ? "#F97316"
                              : "#CBD5E1",
                          }}
                        >
                          {done ? "✅" : "→"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {/* Other games (not in any plan) */}
        {(otherGames.length > 0 || !hasPlans) && (
          <>
            <h2 className="text-xl font-extrabold mb-5 text-[#0F172A]">
              {hasPlans ? "Autres jeux 🎮" : "Mes jeux 🎮"}
            </h2>

            {otherGames.length > 0 || (!hasPlans && (allGames ?? []).length > 0) ? (
              <div className="flex flex-col gap-4">
                {(hasPlans ? otherGames : allGames ?? []).map((game, i) => {
                  const colors = GAME_COLORS[i % GAME_COLORS.length];
                  const icon = GAME_ICONS[game.type] ?? "🎯";
                  const score = bestScores[game.id];
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
                          {score !== undefined
                            ? `Score : ${score}%`
                            : "Appuie pour jouer !"}
                        </p>
                      </div>
                      <span className="text-white text-2xl shrink-0">
                        {score !== undefined ? "✅" : "→"}
                      </span>
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
          </>
        )}
      </div>
    </main>
  );
}
