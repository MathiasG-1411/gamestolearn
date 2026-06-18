import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { studentLogin } from "./actions";

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get("student_id")) {
    redirect("/student/home");
  }

  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50 to-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">
            Games<span className="text-primary">To</span>Learn
          </Link>
          <div className="text-5xl my-4">🎒</div>
          <h1 className="text-2xl font-bold mb-1">Espace élève</h1>
          <p className="text-muted-foreground text-sm">
            Entre tes codes pour rejoindre ta classe !
          </p>
        </div>

        <div className="bg-background rounded-2xl shadow-sm border border-border p-8">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg mb-5 text-center">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={studentLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Code de classe
              </label>
              <input
                name="classCode"
                type="text"
                required
                placeholder="ex : ABC123"
                autoCapitalize="none"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background font-mono tracking-widest text-center text-lg uppercase"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Ton code personnel
              </label>
              <input
                name="studentCode"
                type="text"
                required
                placeholder="ex : XYZ789"
                autoCapitalize="none"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background font-mono tracking-widest text-center text-lg uppercase"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base mt-1 bg-amber-500 hover:bg-amber-600 text-white border-0">
              Rejoindre ma classe 🚀
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
