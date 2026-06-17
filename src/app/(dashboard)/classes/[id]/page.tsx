export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Classe {id}</h1>
      <p className="text-muted-foreground">
        Les élèves de cette classe seront listés ici.
      </p>
    </div>
  );
}
