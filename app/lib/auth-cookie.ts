const AUTH_COOKIE_NAME = "token";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  domain?: string;
};

function getSharedCookieDomain(): string | undefined {
  const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return domain || undefined;
}

/** Shared options for the session JWT httpOnly cookie. */
export function getAuthCookieOptions(maxAge = AUTH_COOKIE_MAX_AGE_SECONDS): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
  const domain = getSharedCookieDomain();
  if (domain) {
    options.domain = domain;
  }
  return options;
}

export function getAuthCookieName(): typeof AUTH_COOKIE_NAME {
  return AUTH_COOKIE_NAME;
}
