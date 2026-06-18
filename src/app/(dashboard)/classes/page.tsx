import Link from "next/link";
import { Plus, Users, ChevronRight, Trash2, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { createClass, deleteClass } from "./actions";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await searchParams;

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, code, created_at")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Mes classes</h1>
          <p className="text-[#475569] text-sm mt-1">
            {(classes?.length ?? 0)} classe{(classes?.length ?? 0) !== 1 ? "s" : ""} créée{(classes?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Formulaire de création */}
      <div
        className="mb-8 p-6 bg-white rounded-[20px]"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
      >
        <h2 className="font-bold text-[#0F172A] mb-4">Créer une nouvelle classe</h2>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-3">
            {decodeURIComponent(error)}
          </p>
        )}
        <form action={createClass} className="flex gap-3">
          <input
            name="name"
            type="text"
            required
            placeholder="Ex : CM2-A, 6ème B, Maternelle…"
            className="flex-1 h-12 border border-gray-200 rounded-[12px] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
          />
          <Button type="submit" className="flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Créer
          </Button>
        </form>
      </div>

      {/* Liste des classes */}
      {classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-[20px] p-6 transition-all duration-200 hover:-translate-y-0.5 group"
              style={{
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Link href={`/classes/${cls.id}`} className="block mb-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#0F172A] text-lg leading-tight truncate">
                      {cls.name}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#475569]">Code élève :</span>
                  <span className="font-mono font-bold text-sm bg-gray-100 text-[#0F172A] px-2.5 py-0.5 rounded-lg tracking-widest">
                    {cls.code}
                  </span>
                </div>
              </Link>
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <Link
                  href={`/classes/${cls.id}`}
                  className="flex items-center gap-1 text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
                >
                  Voir les élèves
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <form action={deleteClass}>
                  <input type="hidden" name="classId" value={cls.id} />
                  <Button
                    variant="destructive"
                    size="sm"
                    type="submit"
                    className="flex items-center gap-1.5 h-8 text-xs px-3"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[20px]" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
          <div className="w-16 h-16 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-[#2563EB]" />
          </div>
          <p className="font-bold text-[#0F172A] text-lg mb-2">
            Aucune classe pour l&apos;instant
          </p>
          <p className="text-[#475569] text-sm">
            Créez votre première classe avec le formulaire ci-dessus !
          </p>
        </div>
      )}
    </div>
  );
}
