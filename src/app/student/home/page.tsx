import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { studentLogout } from "../actions";

export default async function StudentHomePage() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_id")?.value;

  if (!studentId) {
    redirect("/student");
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, first_name, class_id, classes(name)")
    .eq("id", studentId)
    .single();

  if (!student) {
    redirect("/student");
  }

  const className =
    (student.classes as { name: string } | null)?.name ?? "ta classe";

  return (
    <main className="flex flex-col items-center min-h-screen p-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Bonjour {student.first_name} !
            </h1>
            <p className="text-muted-foreground text-sm">{className}</p>
          </div>
          <form action={studentLogout}>
            <Button variant="ghost" size="sm" type="submit">
              Changer d&apos;élève
            </Button>
          </form>
        </div>

        <div className="border border-border rounded-xl p-8 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Bientôt disponible !</p>
          <p className="text-sm">
            Ton enseignant va bientôt ajouter des jeux ici.
          </p>
        </div>
      </div>
    </main>
  );
}
