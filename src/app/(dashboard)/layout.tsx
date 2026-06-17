export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <span className="font-bold text-primary">GamesToLearn</span>
          <span className="text-sm text-muted-foreground">Espace enseignant</span>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
