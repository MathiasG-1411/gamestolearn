import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus, Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
    <div className="space-y-6 animate-fade-up">
      {/* Back */}
      <Link
        href="/classes"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#64748B] hover:text-[#0F172A] font-medium transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour aux classes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2">{cls.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#94A3B8]">Code élève</span>
            <span className="font-mono font-bold text-[15px] bg-[#EFF6FF] text-[#2563EB] px-3 py-1 rounded-xl tracking-[0.2em]">
              {cls.code}
            </span>
          </div>
        </div>
        <div
          className="bg-white rounded-2xl px-4 py-3 text-center min-w-[80px]"
          style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="text-2xl font-bold text-[#0F172A]">{students?.length ?? 0}</div>
          <div className="text-[11px] text-[#94A3B8]">élève{(students?.length ?? 0) !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Add student form */}
      <div
        className="bg-white rounded-2xl p-5"
        style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
      >
        <p className="text-[13px] font-semibold text-[#0F172A] mb-3">Ajouter un élève</p>
        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl mb-3">
            {decodeURIComponent(error)}
          </p>
        )}
        <form action={addStudent} className="flex gap-2.5">
          <input type="hidden" name="classId" value={cls.id} />
          <input
            name="firstName"
            type="text"
            required
            placeholder="Prénom de l'élève"
            className="flex-1 h-10 border border-[#E2E8F0] rounded-xl px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all placeholder:text-[#CBD5E1]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold text-white shrink-0 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </form>
      </div>

      {/* Student list */}
      <div>
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
          Élèves ({students?.length ?? 0})
        </p>

        {students && students.length > 0 ? (
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F8FAFC" }}>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Élève
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Code personnel
                  </th>
                  <th className="px-5 py-3.5 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr
                    key={student.id}
                    className="group hover:bg-[#F8FAFC] transition-colors"
                    style={i < students.length - 1 ? { borderBottom: "1px solid #F8FAFC" } : {}}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[11px] font-bold text-[#2563EB] shrink-0">
                          {student.first_name[0]?.toUpperCase()}
                        </div>
                        <span className="text-[13px] font-semibold text-[#0F172A]">
                          {student.first_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-[12px] bg-[#F8FAFC] border border-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded-lg tracking-wider">
                        {student.code}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form action={removeStudent}>
                        <input type="hidden" name="studentId" value={student.id} />
                        <input type="hidden" name="classId" value={cls.id} />
                        <button
                          type="submit"
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[11px] font-medium text-[#94A3B8] hover:text-red-500 transition-all px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Retirer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="text-center py-14 bg-white rounded-2xl"
            style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-[#CBD5E1]" />
            </div>
            <p className="font-semibold text-[#0F172A] text-[14px] mb-1">Aucun élève</p>
            <p className="text-[12px] text-[#94A3B8]">Ajoutez des élèves avec le formulaire ci-dessus.</p>
          </div>
        )}
      </div>
    </div>
  );
}
