const PLACEHOLDER_HOSTS = new Set(["host", "your-db-host", "your-db-host.example.com"]);

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL est manquant. Copiez .env.example vers .env et configurez la connexion PostgreSQL."
    );
  }
  return url;
}

export function validateDatabaseUrl(url = getDatabaseUrl()): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "DATABASE_URL est invalide. Format attendu : postgresql://user:password@localhost:5432/nom_db"
    );
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`DATABASE_URL doit utiliser le protocole postgresql:// (reçu : ${parsed.protocol})`);
  }

  const hostname = parsed.hostname;
  if (!hostname || PLACEHOLDER_HOSTS.has(hostname)) {
    throw new Error(
      `DATABASE_URL utilise un hôte placeholder (« ${hostname} »). ` +
        "Remplacez-le par localhost en développement ou l'hôte réel de votre base (ex. Supabase)."
    );
  }

  if (!parsed.pathname || parsed.pathname === "/") {
    throw new Error("DATABASE_URL doit inclure le nom de la base (ex. /ankino_db).");
  }
}
