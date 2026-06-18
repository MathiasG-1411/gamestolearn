"use server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export async function createGame(formData: FormData) {
  const title = formData.get("title") as string;
  const type = formData.get("type") as string;

  let config: Json;

  if (type === "quiz") {
    const raw = formData.get("quizConfig") as string;
    config = JSON.parse(raw) as Json;
  } else if (type === "memory") {
    const raw = formData.get("memoryConfig") as string;
    config = JSON.parse(raw) as Json;
  } else if (type === "escape") {
    const raw = formData.get("escapeConfig") as string;
    config = JSON.parse(raw) as Json;
  } else if (type === "anagram") {
    const raw = formData.get("anagramConfig") as string;
    config = JSON.parse(raw) as Json;
  } else if (type === "aventure") {
    const raw = formData.get("aventureConfig") as string;
    if (!raw) throw new Error("Configuration aventure manquante");
    const parsed = JSON.parse(raw) as Json;
    const c = parsed as { chapters?: unknown[] };
    if (!c.chapters || !Array.isArray(c.chapters)) {
      throw new Error("La configuration aventure doit contenir un tableau de chapitres");
    }
    config = parsed;
  } else if (type === "mission") {
    const raw = formData.get("missionConfig") as string;
    if (!raw) throw new Error("Configuration mission manquante");
    const parsed = JSON.parse(raw) as Json;
    const c = parsed as { phases?: unknown[] };
    if (!c.phases || !Array.isArray(c.phases)) {
      throw new Error("La configuration mission doit contenir un tableau de phases");
    }
    config = parsed;
  } else {
    config = {};
  }

  const supabase = createAdminClient();
  await supabase.from("games").insert({ title, type, config });

  redirect("/dashboard/games");
}
