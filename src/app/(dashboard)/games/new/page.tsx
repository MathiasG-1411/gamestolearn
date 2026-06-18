import GameForm from "./game-form";

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Créer un jeu</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Remplis chaque round : une instruction + 4 choix (emoji + label). Coche la bonne réponse en vert.
      </p>
      <GameForm error={error} />
    </div>
  );
}
