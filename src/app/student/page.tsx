import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { studentLogin } from "./actions";

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get("student_id")) redirect("/student/home");

  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 drop-shadow">🎒</div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow mb-1">
            Espace élève
          </h1>
          <p className="text-amber-100 text-sm">Entre tes codes pour jouer !</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl mb-5 text-center font-medium">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={studentLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-bold mb-2 block text-gray-700">
                🏫 Code de classe
              </label>
              <input
                name="classCode"
                type="text"
                required
                placeholder="ABC123"
                autoCapitalize="characters"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-mono tracking-widest text-center focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>
            <div>
              <label className="text-sm font-bold mb-2 block text-gray-700">
                🔑 Ton code personnel
              </label>
              <input
                name="studentCode"
                type="text"
                required
                placeholder="XYZ789"
                autoCapitalize="characters"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-mono tracking-widest text-center focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold py-4 rounded-2xl text-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 mt-1"
            >
              C&apos;est parti ! 🚀
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-amber-100 text-xs">
          <Link href="/" className="hover:text-white">← Retour à l&apos;accueil</Link>
        </p>
      </div>
    </main>
  );
}
