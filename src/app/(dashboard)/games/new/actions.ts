"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createGame(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  if (!title) redirect("/games/new?error=Titre+requis");

  const gameType = (formData.get("gameType") as string) || "image-click";

  // Support both old "rounds" field (legacy) and new "config" field
  const configJson = (formData.get("config") as string) || (formData.get("rounds") as string);
  let config;
  try {
    config = JSON.parse(configJson);
  } catch {
    redirect("/games/new?error=Données+invalides");
  }

  if (!config) redirect("/games/new?error=Configuration+manquante");

  // Basic validation per game type
  if (gameType === "image-click" && (!config.rounds || config.rounds.length === 0)) {
    redirect("/games/new?error=Au+moins+un+round+requis");
  }
  if (gameType === "memory" && (!config.pairs || config.pairs.length < 2)) {
    redirect("/games/new?error=Au+moins+deux+paires+requises");
  }
  if (gameType === "quiz" && (!config.questions || config.questions.length === 0)) {
    redirect("/games/new?error=Au+moins+une+question+requise");
  }
  if (gameType === "anagram" && (!config.words || config.words.length === 0)) {
    redirect("/games/new?error=Au+moins+un+mot+requis");
  }
  if (gameType === "escape" && (!config.questions || config.questions.length === 0)) {
    redirect("/games/new?error=Au+moins+une+énigme+requise");
  }
  if (gameType === "enquete" && (!config.questions || config.questions.length === 0)) {
    redirect("/games/new?error=Au+moins+une+question+requise");
  }
  if (gameType === "aventure" && (!config.chapters || (config.chapters as unknown[]).length === 0)) {
    redirect("/games/new?error=Au+moins+un+chapitre+requis");
  }
  if (gameType === "mission" && (!config.phases || (config.phases as unknown[]).length === 0)) {
    redirect("/games/new?error=Au+moins+une+phase+requise");
  }
  if (gameType === "plateau" && (!config.spaces || (config.spaces as unknown[]).length === 0)) {
    redirect("/games/new?error=Au+moins+une+case+requise");
  }
  if (gameType === "cartes" && (!config.cards || (config.cards as unknown[]).length === 0)) {
    redirect("/games/new?error=Au+moins+une+carte+requise");
  }
  if (gameType === "defi" && (!config.challenges || (config.challenges as unknown[]).length === 0)) {
    redirect("/games/new?error=Au+moins+un+d%C3%A9fi+requis");
  }
  if (gameType === "construction" && (!config.pieces || (config.pieces as unknown[]).length === 0)) {
    redirect("/games/new?error=Au+moins+une+pi%C3%A8ce+requise");
  }
  if (gameType === "quete" && (!config.rooms || (config.rooms as unknown[]).length === 0)) {
    redirect("/games/new?error=Au+moins+une+salle+requise");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("games").insert({
    title,
    type: gameType,
    config,
  });

  if (error) redirect("/games/new?error=Erreur+lors+de+la+sauvegarde");

  redirect("/games");
}
