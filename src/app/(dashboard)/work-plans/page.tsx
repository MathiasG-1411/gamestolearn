import Link from "next/link";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteWorkPlan } from "./actions";

type AssignmentRow = {
  plan_id: string;
  class_id: string;
  classes: { name: string } | null;
};

export default async function WorkPlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const { data: plans } = await admin
    .from("work_plans")
    .select("id, title, description, game_ids, created_at")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  const allGameIds = [
    ...new Set((plans ?? []).flatMap((p) => p.game_ids as string[])),
  ];
  const { data: games } =
    allGameIds.length > 0
      ? await admin.from("games").select("id, title, type").in("id", allGameIds)
      : { data: [] };

  const gamesById = Object.fromEntries((games ?? []).map((g) => [g.id, g]));

  const planIds = (plans ?? []).map((p) => p.id);
  const { data: assignments } =
    planIds.length > 0
      ? await admin
          .from("work_plan_classes")
          .select("plan_id, class_id, classes(name)")
          .in("plan_id", planIds)
      : { data: [] };

  const assignmentsByPlan: Record<string, AssignmentRow[]> = {};
  for (const a of (assignments ?? []) as AssignmentRow[]) {
    if (!assignmentsByPlan[a.plan_id]) assignmentsByPlan[a.plan_id] = [];
    assignmentsByPlan[a.plan_id].push(a);
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Plans de travail
          </h1>
          <p className="text-[13px] text-[#94A3B8] mt-0.5">
            {(plans?.length ?? 0)} plan{(plans?.length ?? 0) !== 1 ? "s" : ""}{" "}
            créé{(plans?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/work-plans/new"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-sm"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Créer un plan
        </Link>
      </div>

      {plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((plan, i) => {
            const planGames = (plan.game_ids as string[])
              .map((id) => gamesById[id])
              .filter(Boolean);
            const planAssignments = assignmentsByPlan[plan.id] ?? [];

            return (
              <div
                key={plan.id}
                className="group bg-white rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
                style={{
                  border: "1px solid #F1F5F9",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "#EFF6FF" }}
                    >
                      <ClipboardList className="w-5 h-5" style={{ color: "#2563EB" }} />
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "#EFF6FF", color: "#2563EB" }}
                    >
                      {planGames.length} jeu{planGames.length !== 1 ? "x" : ""}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#0F172A] text-[15px] leading-tight mb-1 pr-2">
                    {plan.title}
                  </h3>
                  {plan.description && (
                    <p className="text-[12px] text-[#94A3B8] line-clamp-2 mb-2">
                      {plan.description}
                    </p>
                  )}

                  {/* Ordered game preview */}
                  {planGames.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                      {planGames.slice(0, 3).map((g, idx) => (
                        <span key={g.id} className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full text-[9px] font-bold bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          {g.title}
                        </span>
                      ))}
                      {planGames.length > 3 && (
                        <span className="text-[11px] text-[#94A3B8] pl-5">
                          +{planGames.length - 3} autre{planGames.length - 3 !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Assigned classes */}
                  {planAssignments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {planAssignments.map((a) => (
                        <span
                          key={a.class_id}
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "#F0FDF4", color: "#16A34A" }}
                        >
                          {a.classes?.name ?? "Classe"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: "1px solid #F8FAFC", background: "#FAFAFA" }}
                >
                  <span className="text-[11px] text-[#CBD5E1]">
                    {new Date(plan.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <form action={deleteWorkPlan}>
                    <input type="hidden" name="planId" value={plan.id} />
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
          style={{
            border: "1px solid #F1F5F9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-[#2563EB]" />
          </div>
          <p className="font-semibold text-[#0F172A] text-[15px] mb-1">
            Aucun plan de travail
          </p>
          <p className="text-[13px] text-[#94A3B8] mb-5">
            Créez une séquence de jeux ordonnée pour vos élèves.
          </p>
          <Link
            href="/work-plans/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Créer un plan
          </Link>
        </div>
      )}
    </div>
  );
}
