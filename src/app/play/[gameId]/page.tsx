export default async function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <h1 className="text-3xl font-bold">Jeu : {gameId}</h1>
      <p className="text-muted-foreground">Le jeu se chargera ici.</p>
    </main>
  );
}
