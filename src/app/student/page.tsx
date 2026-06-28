import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { studentLogin } from "./actions";
import { verifyStudentId } from "@/lib/student-session";

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  if (verifyStudentId(cookieStore.get("student_id")?.value)) redirect("/student/home");

  const { error } = await searchParams;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F97316 50%, #EC4899 100%)" }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 drop-shadow-lg">🎒</div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow-sm mb-2">
            Espace élève
          </h1>
          <p className="text-white/80 text-sm font-medium">
            Entre tes codes pour jouer !
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[24px] shadow-2xl p-8">
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl mb-5 text-center font-medium">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={studentLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-bold mb-2 block text-[#0F172A]">
                🏫 Code de classe
              </label>
              <input
                name="classCode"
                type="text"
                required
                placeholder="ABC123"
                autoCapitalize="characters"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-2xl font-mono tracking-widest text-center focus:outline-none focus:border-[#FBBF24] focus:ring-4 focus:ring-[#FBBF24]/20 uppercase transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-bold mb-2 block text-[#0F172A]">
                🔑 Ton code personnel
              </label>
              <input
                name="studentCode"
                type="text"
                required
                placeholder="XYZ789"
                autoCapitalize="characters"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-2xl font-mono tracking-widest text-center focus:outline-none focus:border-[#FBBF24] focus:ring-4 focus:ring-[#FBBF24]/20 uppercase transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FBBF24] to-[#F97316] text-white font-extrabold py-4 rounded-2xl text-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 mt-1"
            >
              C&apos;est parti ! 🚀
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-white/70 text-xs">
          <Link href="/" className="hover:text-white transition-colors">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  );
}
