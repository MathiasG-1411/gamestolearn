"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createGame(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  if (!title) redirect("/games/new?error=Titre+requis");

  const roundsJson = formData.get("rounds") as string;
  let rounds;
  try {
    rounds = JSON.parse(roundsJson);
  } catch {
    redirect("/games/new?error=Données+invalides");
  }

  if (!rounds || rounds.length === 0) {
    redirect("/games/new?error=Au+moins+un+round+requis");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("games").insert({
    title,
    type: "image-click",
    config: { rounds },
  });

  if (error) redirect("/games/new?error=Erreur+lors+de+la+sauvegarde");

  redirect("/games");
}
