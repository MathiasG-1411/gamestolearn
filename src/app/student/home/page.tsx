import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const adminSupabase = createAdminClient();
  const { data: games } = await adminSupabase
    .from("games")
    .select("id, title, type")
    .order("created_at");

  return (
    <main className="flex flex-col items-center min-h-screen p-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Bonjour {student.first_name} !</h1>
            <p className="text-muted-foreground text-sm">{className}</p>
          </div>
          <form action={studentLogout}>
            <Button variant="ghost" size="sm" type="submit">
              Changer d&apos;élève
            </Button>
          </form>
        </div>

        <h2 className="font-medium mb-4">Jeux disponibles</h2>

        {games && games.length > 0 ? (
          <div className="flex flex-col gap-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/play/${game.id}`}
                className="border border-border rounded-xl p-5 hover:bg-muted/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{game.title}</p>
                  <p className="text-sm text-muted-foreground">{game.type}</p>
                </div>
                <span className="text-2xl">🎮</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-border rounded-xl p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Bientôt disponible !</p>
            <p className="text-sm">Ton enseignant va bientôt ajouter des jeux ici.</p>
          </div>
        )}
      </div>
    </main>
  );
}
