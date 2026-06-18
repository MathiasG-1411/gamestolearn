import Link from "next/link";
import { Plus, Users, ChevronRight, Trash2, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Mes classes</h1>
          <p className="text-[13px] text-[#94A3B8] mt-0.5">
            {(classes?.length ?? 0)} classe{(classes?.length ?? 0) !== 1 ? "s" : ""} créée{(classes?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Create form */}
      <div
        className="bg-white rounded-2xl p-5"
        style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
      >
        <p className="text-[13px] font-semibold text-[#0F172A] mb-3">Nouvelle classe</p>
        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl mb-3">
            {decodeURIComponent(error)}
          </p>
        )}
        <form action={createClass} className="flex gap-2.5">
          <input
            name="name"
            type="text"
            required
            placeholder="Ex : CM2-A, 6ème B, Maternelle…"
            className="flex-1 h-10 border border-[#E2E8F0] rounded-xl px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all placeholder:text-[#CBD5E1]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold text-white shrink-0 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Créer
          </button>
        </form>
      </div>

      {/* Class list */}
      {classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((cls, i) => (
            <div
              key={cls.id}
              className="group bg-white rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
              style={{
                border: "1px solid #F1F5F9",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
                animationDelay: `${i * 50}ms`,
              }}
            >
              <Link href={`/classes/${cls.id}`} className="block p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <h3 className="font-semibold text-[#0F172A] text-[15px] leading-tight truncate">
                    {cls.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#94A3B8]">Code élève</span>
                  <span className="font-mono font-bold text-[13px] bg-[#F8FAFC] border border-[#F1F5F9] text-[#2563EB] px-2.5 py-0.5 rounded-lg tracking-widest">
                    {cls.code}
                  </span>
                </div>
              </Link>
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: "1px solid #F8FAFC", background: "#FAFAFA" }}
              >
                <Link
                  href={`/classes/${cls.id}`}
                  className="flex items-center gap-1 text-[12px] text-[#64748B] hover:text-[#2563EB] font-medium transition-colors"
                >
                  Voir les élèves
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <form action={deleteClass}>
                  <input type="hidden" name="classId" value={cls.id} />
                  <button
                    type="submit"
                    className="flex items-center gap-1 text-[11px] font-medium text-[#94A3B8] hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-16 bg-white rounded-2xl"
          style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7 text-[#2563EB]" />
          </div>
          <p className="font-semibold text-[#0F172A] text-[15px] mb-1">Aucune classe pour l&apos;instant</p>
          <p className="text-[13px] text-[#94A3B8]">Créez votre première classe avec le formulaire ci-dessus.</p>
        </div>
      )}
    </div>
  );
}
