"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteGame(formData: FormData) {
  const gameId = formData.get("gameId") as string;
  const supabase = createAdminClient();
  await supabase.from("games").delete().eq("id", gameId);
  revalidatePath("/games");
  redirect("/games");
}
