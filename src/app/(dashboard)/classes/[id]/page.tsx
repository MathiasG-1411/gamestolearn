import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus, Trash2, Users } from "lucide-react";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      {/* Back link */}
      <Link
        href="/classes"
        className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#0F172A] mb-6 transition-colors font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour aux classes
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-3">{cls.name}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[#475569]">Code de classe :</span>
          <span className="font-mono font-bold text-base bg-[#2563EB]/10 text-[#2563EB] px-3 py-1 rounded-lg tracking-widest">
            {cls.code}
          </span>
          <span className="text-xs text-[#475569]">
            (les élèves l&apos;utilisent pour se connecter)
          </span>
        </div>
      </div>

      {/* Ajouter un élève */}
      <div
        className="mb-8 p-6 bg-white rounded-[20px]"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
      >
        <h2 className="font-bold text-[#0F172A] mb-4">Ajouter un élève</h2>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-3">
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
            className="flex-1 h-12 border border-gray-200 rounded-[12px] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
          />
          <Button type="submit" className="flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </form>
      </div>

      {/* Liste des élèves */}
      <div>
        <h2 className="font-bold text-[#0F172A] text-xl mb-4">
          Élèves{" "}
          <span className="text-[#475569] font-normal text-base">
            ({students?.length ?? 0})
          </span>
        </h2>

        {students && students.length > 0 ? (
          <div
            className="bg-white rounded-[20px] overflow-hidden"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-[#0F172A]">
                    Prénom
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-[#0F172A]">
                    Code personnel
                  </th>
                  <th className="px-6 py-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr
                    key={student.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-6 py-3.5 font-medium text-[#0F172A]">
                      {student.first_name}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-sm bg-gray-100 text-[#475569] px-2.5 py-1 rounded-lg tracking-wider">
                        {student.code}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <form action={removeStudent}>
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />
                        <input type="hidden" name="classId" value={cls.id} />
                        <Button
                          variant="destructive"
                          size="sm"
                          type="submit"
                          className="flex items-center gap-1 h-7 text-xs px-2.5"
                        >
                          <Trash2 className="w-3 h-3" />
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
          <div
            className="text-center py-16 bg-white rounded-[20px]"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-bold text-[#0F172A] mb-1">
              Aucun élève dans cette classe
            </p>
            <p className="text-sm text-[#475569]">
              Ajoutez des élèves avec le formulaire ci-dessus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
