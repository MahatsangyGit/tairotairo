/** Racines dashboard : surbrillance uniquement sur l'URL exacte (pas les sous-pages). */
const DASHBOARD_EXACT_ONLY = new Set([
  "/dashboard/client",
  "/dashboard/provider",
]);

export function isNavLinkActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (DASHBOARD_EXACT_ONLY.has(href)) return false;
  return pathname.startsWith(`${href}/`);
}
