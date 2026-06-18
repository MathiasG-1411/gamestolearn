"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function saveScore(
  studentId: string,
  gameId: string,
  score: number
) {
  const supabase = createAdminClient();
  await supabase.from("progress").insert({ student_id: studentId, game_id: gameId, score });
}
