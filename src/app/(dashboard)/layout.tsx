import { Sidebar } from "./sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name ?? null;
  const email = user?.email ?? "";
  const displayName = fullName ?? email.split("@")[0] ?? "Enseignant";

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar userEmail={email} userName={displayName} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
