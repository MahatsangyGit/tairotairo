/**
 * Multi-host origins for the Tairo ecosystem (ampio / ampindramo / ampianaro).
 * Used for absolute links in emails/notifications and metadataBase.
 */

export type TairoVertical = "marketplace" | "rental" | "learning";

function normalizeHost(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.includes("://")) {
      return new URL(trimmed).host.toLowerCase();
    }
    return trimmed.replace(/\/+$/, "").toLowerCase();
  } catch {
    return null;
  }
}

function originFromHost(host: string): string {
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export function getMarketplaceOrigin(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      return new URL(appUrl).origin;
    } catch {
      // fall through
    }
  }
  return "http://localhost:3000";
}

export function getRentalHost(): string | null {
  return normalizeHost(process.env.RENTAL_HOST);
}

export function getLearningHost(): string | null {
  return normalizeHost(process.env.LEARNING_HOST);
}

export function getRentalOrigin(): string {
  const host = getRentalHost();
  if (host) return originFromHost(host);
  return `${getMarketplaceOrigin()}/ampindramo`;
}

export function getLearningOrigin(): string {
  const host = getLearningHost();
  if (host) return originFromHost(host);
  return `${getMarketplaceOrigin()}/ampianaro`;
}

export function getVerticalOrigin(vertical: TairoVertical): string {
  switch (vertical) {
    case "rental":
      return getRentalOrigin();
    case "learning":
      return getLearningOrigin();
    default:
      return getMarketplaceOrigin();
  }
}

/** Absolute URL for a path on a given vertical (path may start with /). */
export function absoluteVerticalUrl(
  vertical: TairoVertical,
  path: string
): string {
  const origin = getVerticalOrigin(vertical).replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;

  // When no dedicated host is configured, rental/learning origins already
  // include the path prefix — strip duplicate prefixes.
  if (vertical === "rental" && !getRentalHost()) {
    if (normalized === "/ampindramo" || normalized.startsWith("/ampindramo/")) {
      return `${getMarketplaceOrigin().replace(/\/+$/, "")}${normalized}`;
    }
    return `${origin}${normalized}`;
  }
  if (vertical === "learning" && !getLearningHost()) {
    if (normalized === "/ampianaro" || normalized.startsWith("/ampianaro/")) {
      return `${getMarketplaceOrigin().replace(/\/+$/, "")}${normalized}`;
    }
    return `${origin}${normalized}`;
  }

  return `${origin}${normalized}`;
}

export function isRentalEnabled(): boolean {
  return process.env.RENTAL_ENABLED !== "false";
}

export function isLearningEnabled(): boolean {
  return process.env.LEARNING_ENABLED !== "false";
}

/** All hostnames allowed for Turnstile / cookie-related checks. */
export function getAllowedHostnames(): string[] {
  const hosts = new Set<string>();
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) hosts.add(new URL(appUrl).hostname.toLowerCase());
  } catch {
    // ignore
  }
  const rental = getRentalHost();
  if (rental) hosts.add(rental.split(":")[0]!);
  const learning = getLearningHost();
  if (learning) hosts.add(learning.split(":")[0]!);
  return [...hosts];
}

export function resolveVerticalFromHost(hostHeader: string | null): TairoVertical {
  const host = normalizeHost(hostHeader);
  if (!host) return "marketplace";
  const rental = getRentalHost();
  if (rental && host === rental) return "rental";
  const learning = getLearningHost();
  if (learning && host === learning) return "learning";
  return "marketplace";
}

/**
 * Lien « retour Tairo ampio » depuis ampindramo / ampianaro.
 *
 * Sur l'hôte marketplace (chemins `/ampindramo`, `/ampianaro`, previews Vercel),
 * renvoyer `/` pour rester sur la même origine — sinon `NEXT_PUBLIC_APP_URL`
 * (domaine canonique) ouvre un autre hôte et le cookie de session host-only
 * n'est pas envoyé : déconnexion apparente.
 *
 * Sur un sous-domaine dédié, renvoyer l'origine marketplace (SSO via
 * AUTH_COOKIE_DOMAIN).
 */
export function getMarketplaceHomeHref(hostHeader: string | null): string {
  if (resolveVerticalFromHost(hostHeader) === "marketplace") {
    return "/";
  }
  return getMarketplaceOrigin();
}
