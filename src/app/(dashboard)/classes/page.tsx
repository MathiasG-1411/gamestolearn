import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { createClass, deleteClass } from "./actions";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await searchParams;

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, code, created_at")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Mes classes</h1>

      {/* Formulaire de création */}
      <div className="mb-8 p-6 border border-border rounded-xl bg-muted/30">
        <h2 className="font-medium mb-4">Créer une nouvelle classe</h2>
        {error && (
          <p className="text-sm text-destructive mb-3">{decodeURIComponent(error)}</p>
        )}
        <form action={createClass} className="flex gap-3">
          <input
            name="name"
            type="text"
            required
            placeholder="Ex : CM2-A, 6ème B, Maternelle…"
            className="flex-1 border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
          <Button type="submit">Créer</Button>
        </form>
      </div>

      {/* Liste des classes */}
      {classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="border border-border rounded-xl p-6 hover:bg-muted/30 transition-colors"
            >
              <Link href={`/classes/${cls.id}`} className="block mb-4">
                <h3 className="font-semibold text-lg mb-1">{cls.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Code élève :{" "}
                  <span className="font-mono font-bold text-foreground">
                    {cls.code}
                  </span>
                </p>
              </Link>
              <div className="flex justify-between items-center">
                <Link
                  href={`/classes/${cls.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Voir les élèves →
                </Link>
                <form action={deleteClass}>
                  <input type="hidden" name="classId" value={cls.id} />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className="text-destructive hover:text-destructive"
                  >
                    Supprimer
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Aucune classe pour l&apos;instant.</p>
          <p className="text-sm">Créez votre première classe ci-dessus !</p>
        </div>
      )}
    </div>
  );
}
