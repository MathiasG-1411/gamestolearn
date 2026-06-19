import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WorkPlanForm from "./work-plan-form";

export default async function NewWorkPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const [{ data: games }, { data: classes }] = await Promise.all([
    admin
      .from("games")
      .select("id, title, type")
      .order("created_at", { ascending: false }),
    supabase
      .from("classes")
      .select("id, name")
      .eq("teacher_id", user!.id)
      .order("name"),
  ]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
          Nouveau plan de travail
        </h1>
        <p className="text-[13px] text-[#94A3B8] mt-0.5">
          Organisez une séquence de jeux pour vos élèves
        </p>
      </div>
      <WorkPlanForm games={games ?? []} classes={classes ?? []} />
    </div>
  );
}
