import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import GameForm from "./game-form";

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-xl">
      <Link
        href="/games"
        className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#0F172A] mb-6 transition-colors font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour aux jeux
      </Link>
      <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Créer un jeu</h1>
      <p className="text-[#475569] text-sm mb-8">
        Remplis chaque round : une instruction + 4 choix (emoji + label). Coche la bonne réponse en vert.
      </p>
      <GameForm error={error} />
    </div>
  );
}
