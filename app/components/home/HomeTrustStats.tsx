export default function HomeTrustStats({
  providerCount,
  completedCount,
}: {
  providerCount: number;
  completedCount: number;
}) {
  if (providerCount === 0 && completedCount === 0) return null;

  return (
    <section className="border-y border-border bg-neutral-50 dark:bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:flex-row sm:items-center sm:justify-center sm:gap-20 sm:px-6 lg:px-8">
        {providerCount > 0 ? (
          <div className="text-center">
            <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums sm:text-5xl">
              {providerCount.toLocaleString("fr-MG")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Prestataires de service à domicile vérifiés
            </p>
          </div>
        ) : null}
        {completedCount > 0 ? (
          <div className="text-center">
            <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums sm:text-5xl">
              {completedCount.toLocaleString("fr-MG")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Services réalisés
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
