"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteWorkPlan(formData: FormData) {
  const planId = formData.get("planId") as string;
  if (!planId) return;
  const admin = createAdminClient();
  await admin.from("work_plans").delete().eq("id", planId);
  revalidatePath("/work-plans");
}
