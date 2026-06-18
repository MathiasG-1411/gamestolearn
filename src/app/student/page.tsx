import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-2">Espace élève</h1>
        <p className="text-muted-foreground text-center mb-8">
          Entre tes codes pour rejoindre ta classe
        </p>

        {error && (
          <p className="text-sm text-destructive text-center mb-4">
            {decodeURIComponent(error)}
          </p>
        )}

        <form action={studentLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Code de classe
            </label>
            <input
              name="classCode"
              type="text"
              required
              placeholder="ex: abc123"
              autoCapitalize="none"
              className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background font-mono"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Ton code personnel
            </label>
            <input
              name="studentCode"
              type="text"
              required
              placeholder="ex: xyz789"
              autoCapitalize="none"
              className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background font-mono"
            />
          </div>
          <Button type="submit" className="w-full mt-2">
            Rejoindre ma classe
          </Button>
        </form>
      </div>
    </main>
  );
}
