import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import GamePlayer from "./game-player";
import MemoryGame from "./games/memory-game";
import QuizGame from "./games/quiz-game";
import AnagramGame from "./games/anagram-game";
import EscapeGame from "./games/escape-game";
import EnqueteGame from "./games/enquete-game";
import AventureGame from "./games/aventure-game";
import MissionGame from "./games/mission-game";
import PlateauGame from "./games/plateau-game";
import CartesGame from "./games/cartes-game";
import DefiGame from "./games/defi-game";
import ConstructionGame from "./games/construction-game";

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
      {game.type === "memory" && (
        <MemoryGame game={game} studentId={studentId} />
      )}
      {game.type === "quiz" && (
        <QuizGame game={game} studentId={studentId} />
      )}
      {game.type === "anagram" && (
        <AnagramGame game={game} studentId={studentId} />
      )}
      {game.type === "escape" && (
        <EscapeGame game={game} studentId={studentId} />
      )}
      {game.type === "enquete" && (
        <EnqueteGame game={game} studentId={studentId} />
      )}
      {game.type === "aventure" && (
        <AventureGame game={game} studentId={studentId} />
      )}
      {game.type === "mission" && (
        <MissionGame game={game} studentId={studentId} />
      )}
      {game.type === "plateau" && (
        <PlateauGame game={game} studentId={studentId} />
      )}
      {game.type === "cartes" && (
        <CartesGame game={game} studentId={studentId} />
      )}
      {game.type === "defi" && (
        <DefiGame game={game} studentId={studentId} />
      )}
      {game.type === "construction" && (
        <ConstructionGame game={game} studentId={studentId} />
      )}
      {(game.type === "image-click" || !["memory", "quiz", "anagram", "escape", "enquete", "aventure", "mission", "plateau", "cartes", "defi", "construction"].includes(game.type)) && (
        <GamePlayer game={game} studentId={studentId} />
      )}
    </main>
  );
}
