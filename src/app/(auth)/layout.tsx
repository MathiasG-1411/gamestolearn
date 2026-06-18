export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(180deg, #F8FAFC 0%, #EEF4FF 100%)",
      }}
    >
      {children}
    </div>
  );
}
