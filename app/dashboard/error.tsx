"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-muted-foreground text-sm">Une erreur est survenue.</p>
      <button
        type="button"
        onClick={reset}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        Réessayer
      </button>
    </div>
  );
}
