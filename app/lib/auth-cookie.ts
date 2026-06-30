const AUTH_COOKIE_NAME = "token";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

/** Shared options for the session JWT httpOnly cookie. */
export function getAuthCookieOptions(maxAge = AUTH_COOKIE_MAX_AGE_SECONDS): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function getAuthCookieName(): typeof AUTH_COOKIE_NAME {
  return AUTH_COOKIE_NAME;
}
