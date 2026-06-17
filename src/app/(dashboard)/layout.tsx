import Link from "next/link";
import { logout } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-primary">
              GamesToLearn
            </Link>
            <Link
              href="/classes"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Classes
            </Link>
            <Link
              href="/games"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Jeux
            </Link>
          </div>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              Se déconnecter
            </Button>
          </form>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
