"use client";

export default function ProviderDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-muted-foreground text-sm text-center">
        Une erreur est survenue sur votre espace prestataire.
        {process.env.NODE_ENV === "development" && error?.message ? (
          <>
            <br />
            <span className="text-xs opacity-70">{error.message}</span>
          </>
        ) : null}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        Réessayer
      </button>
    </div>
  );
}
