"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createWorkPlan(
  formData: FormData
): Promise<{ error?: string }> {
  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Titre requis" };

  const gameIdsJson = formData.get("gameIds") as string;
  const classIdsJson = formData.get("classIds") as string;

  let gameIds: string[], classIds: string[];
  try {
    gameIds = JSON.parse(gameIdsJson);
    classIds = JSON.parse(classIdsJson);
  } catch {
    return { error: "Données invalides" };
  }

  if (!gameIds || gameIds.length === 0) {
    return { error: "Sélectionnez au moins un jeu" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const description = (formData.get("description") as string)?.trim() || null;

  const admin = createAdminClient();
  const { data: plan, error: planError } = await admin
    .from("work_plans")
    .insert({ teacher_id: user.id, title, description, game_ids: gameIds })
    .select("id")
    .single();

  if (planError || !plan) return { error: "Erreur lors de la sauvegarde" };

  if (classIds && classIds.length > 0) {
    await admin
      .from("work_plan_classes")
      .insert(classIds.map((classId) => ({ plan_id: plan.id, class_id: classId })));
  }

  revalidatePath("/work-plans");
  return {};
}
