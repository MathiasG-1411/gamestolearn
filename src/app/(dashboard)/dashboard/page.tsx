import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Tableau de bord</h1>
      <p className="text-muted-foreground mb-6">
        Connecté en tant que <strong>{user?.email}</strong>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/classes"
          className="block p-6 border border-border rounded-xl hover:bg-muted transition-colors"
        >
          <h2 className="font-semibold text-lg mb-1">Mes classes</h2>
          <p className="text-muted-foreground text-sm">
            Gérer vos classes et vos élèves.
          </p>
        </a>
        <a
          href="/games"
          className="block p-6 border border-border rounded-xl hover:bg-muted transition-colors"
        >
          <h2 className="font-semibold text-lg mb-1">Jeux</h2>
          <p className="text-muted-foreground text-sm">
            Consulter les jeux disponibles.
          </p>
        </a>
      </div>
    </div>
  );
}
