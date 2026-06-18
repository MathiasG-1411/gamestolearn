import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count: classCount } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", user!.id);

  const { count: studentCount } = await supabase
    .from("students")
    .select("students.id", { count: "exact", head: true })
    .eq("classes.teacher_id", user!.id);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Bonjour 👋</h1>
        <p className="text-muted-foreground">{user?.email}</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/classes"
          className="group bg-background border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all"
        >
          <div className="text-4xl mb-4">🏫</div>
          <h2 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            Mes classes
          </h2>
          <p className="text-muted-foreground text-sm mb-3">
            Gérez vos classes et vos élèves.
          </p>
          <p className="text-sm font-medium text-primary">
            {classCount ?? 0} classe{(classCount ?? 0) !== 1 ? "s" : ""} →
          </p>
        </Link>

        <Link
          href="/games"
          className="group bg-background border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all"
        >
          <div className="text-4xl mb-4">🎮</div>
          <h2 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            Jeux
          </h2>
          <p className="text-muted-foreground text-sm mb-3">
            Créez et gérez vos jeux pédagogiques.
          </p>
          <p className="text-sm font-medium text-primary">Voir les jeux →</p>
        </Link>

        <Link
          href="/progress"
          className="group bg-background border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all sm:col-span-2"
        >
          <div className="text-4xl mb-4">📊</div>
          <h2 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            Progression
          </h2>
          <p className="text-muted-foreground text-sm mb-3">
            Suivez les scores de vos élèves par classe et par jeu.
          </p>
          <p className="text-sm font-medium text-primary">Voir la progression →</p>
        </Link>
      </div>
    </div>
  );
}
