export type GuestBrowseIntent = "services" | "requests";

export const GUEST_BROWSE_DESTINATIONS: Record<GuestBrowseIntent, string> = {
  services: "/services",
  requests: "/requests",
};

export function isGuestBrowsePath(pathname: string): boolean {
  return (
    pathname === "/services" ||
    pathname.startsWith("/services/") ||
    pathname === "/requests" ||
    pathname.startsWith("/requests/")
  );
}

export function guestBrowseIntentFromPath(pathname: string): GuestBrowseIntent {
  return pathname.startsWith("/requests") ? "requests" : "services";
}

export function isGuestBrowseIntent(value: string | null): value is GuestBrowseIntent {
  return value === "services" || value === "requests";
}
