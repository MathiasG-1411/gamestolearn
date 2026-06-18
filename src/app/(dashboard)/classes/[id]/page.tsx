import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { addStudent, removeStudent } from "./actions";

export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, code")
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .single();

  if (!cls) notFound();

  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, code")
    .eq("class_id", id)
    .order("first_name");

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <Link
          href="/classes"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 block"
        >
          ← Retour aux classes
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{cls.name}</h1>
            <p className="text-muted-foreground mt-1">
              Code de classe :{" "}
              <span className="font-mono font-bold text-foreground text-lg">
                {cls.code}
              </span>
              <span className="text-sm ml-2">
                (les élèves l&apos;utilisent pour se connecter)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Ajouter un élève */}
      <div className="mb-8 p-6 border border-border rounded-xl bg-muted/30">
        <h2 className="font-medium mb-4">Ajouter un élève</h2>
        {error && (
          <p className="text-sm text-destructive mb-3">
            {decodeURIComponent(error)}
          </p>
        )}
        <form action={addStudent} className="flex gap-3">
          <input type="hidden" name="classId" value={cls.id} />
          <input
            name="firstName"
            type="text"
            required
            placeholder="Prénom de l'élève"
            className="flex-1 border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
          <Button type="submit">Ajouter</Button>
        </form>
      </div>

      {/* Liste des élèves */}
      <div>
        <h2 className="font-medium mb-4">
          Élèves{" "}
          <span className="text-muted-foreground font-normal">
            ({students?.length ?? 0})
          </span>
        </h2>

        {students && students.length > 0 ? (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Prénom</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Code personnel
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr
                    key={student.id}
                    className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                  >
                    <td className="px-4 py-3 font-medium">
                      {student.first_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-muted-foreground">
                        {student.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={removeStudent}>
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />
                        <input
                          type="hidden"
                          name="classId"
                          value={cls.id}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          type="submit"
                          className="text-destructive hover:text-destructive"
                        >
                          Retirer
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-xl">
            <p>Aucun élève dans cette classe.</p>
            <p className="text-sm mt-1">
              Ajoutez des élèves avec le formulaire ci-dessus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
