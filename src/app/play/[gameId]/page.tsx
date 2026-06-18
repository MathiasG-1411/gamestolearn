import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import GamePlayer from "./game-player";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_id")?.value;
  if (!studentId) redirect("/student");

  const { gameId } = await params;
  const supabase = createAdminClient();

  const { data: game } = await supabase
    .from("games")
    .select("id, title, type, config")
    .eq("id", gameId)
    .single();

  if (!game) notFound();

  return (
    <main>
      <GamePlayer game={game} studentId={studentId} />
    </main>
  );
}
