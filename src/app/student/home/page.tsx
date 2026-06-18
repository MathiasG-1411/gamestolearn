import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { studentLogout } from "../actions";

export default async function StudentHomePage() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_id")?.value;
  if (!studentId) redirect("/student");

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, first_name, class_id, classes(name)")
    .eq("id", studentId)
    .single();

  if (!student) redirect("/student");

  const className = (student.classes as { name: string } | null)?.name ?? "ta classe";

  const { data: games } = await supabase
    .from("games")
    .select("id, title, type")
    .order("created_at");

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-bold text-lg">
            Games<span className="text-primary">To</span>Learn
          </span>
          <form action={studentLogout}>
            <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground text-xs">
              Changer d&apos;élève
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👋</div>
          <h1 className="text-3xl font-bold mb-1">Bonjour {student.first_name} !</h1>
          <p className="text-muted-foreground">{className}</p>
        </div>

        {/* Games */}
        <h2 className="font-semibold text-lg mb-4">Mes jeux</h2>

        {games && games.length > 0 ? (
          <div className="flex flex-col gap-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/play/${game.id}`}
                className="bg-background border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all flex items-center gap-4 group"
              >
                <div className="text-4xl">🎮</div>
                <div className="flex-1">
                  <p className="font-semibold group-hover:text-primary transition-colors">{game.title}</p>
                  <p className="text-sm text-muted-foreground">Clique pour jouer !</p>
                </div>
                <span className="text-muted-foreground group-hover:text-primary transition-colors text-xl">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-background border border-border rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <p className="font-medium mb-1">Bientôt disponible !</p>
            <p className="text-sm text-muted-foreground">
              Ton enseignant va bientôt ajouter des jeux ici.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
