import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { deleteGame } from "./actions";

const GAME_TYPE_META: Record<string, { icon: string; label: string }> = {
  "image-click": { icon: "🎯", label: "Clique sur l'image" },
  memory:        { icon: "🧠", label: "Memory" },
  quiz:          { icon: "⏱️", label: "Quiz chronométré" },
  anagram:       { icon: "🔤", label: "Anagramme" },
};

function itemCount(config: unknown, type: string): string {
  const c = config as Record<string, unknown[]>;
  if (type === "image-click") return `${(c?.rounds ?? []).length} rounds`;
  if (type === "memory")      return `${(c?.pairs ?? []).length} paires`;
  if (type === "quiz")        return `${(c?.questions ?? []).length} questions`;
  if (type === "anagram")     return `${(c?.words ?? []).length} mots`;
  return "";
}

export default async function GamesPage() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("id, title, type, config, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mes jeux</h1>
        <Button asChild>
          <Link href="/games/new">+ Créer un jeu</Link>
        </Button>
      </div>

      {games && games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => {
            const meta = GAME_TYPE_META[game.type] ?? { icon: "🎮", label: game.type };
            return (
              <div
                key={game.id}
                className="bg-background border border-border rounded-2xl p-6 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{meta.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{game.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {itemCount(game.config, game.type)} · {meta.label}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(game.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <form action={deleteGame}>
                    <input type="hidden" name="gameId" value={game.id} />
                    <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive">
                      Supprimer
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <div className="text-5xl mb-4">🎮</div>
          <p className="font-semibold text-lg mb-2">Aucun jeu pour l&apos;instant</p>
          <p className="text-muted-foreground text-sm mb-6">Créez votre premier jeu !</p>
          <Button asChild>
            <Link href="/games/new">Créer un jeu</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
