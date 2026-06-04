import { applySlotToDate } from "@/lib/datetime-slot";

export interface BookingDisplayInfo {
  source: "service" | "request";
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  href: string;
  archived?: boolean;
}

export type BookingDisplaySnapshot = {
  displayTitle: string;
  displayPrice: number;
  displayCategory: string;
  displayLocation: string;
  displaySource: "service" | "request";
  displayTargetId: string;
};

interface BookingForDisplay {
  service: {
    id: string;
    title: string;
    price: number;
    category: string;
    location: string;
  } | null;
  requestResponse: {
    proposedPrice: number | null;
    request: {
      id: string;
      title: string;
      budget: number;
      category: string;
      location: string;
    } | null;
  } | null;
  displayTitle?: string | null;
  displayPrice?: number | null;
  displayCategory?: string | null;
  displayLocation?: string | null;
  displaySource?: string | null;
  displayTargetId?: string | null;
}

export type BookingDisplayViewer = "client" | "provider";

function archivedRequestHref(viewer: BookingDisplayViewer): string {
  return viewer === "client"
    ? "/dashboard/client/requests"
    : "/dashboard/provider/proposals";
}

export function snapshotFromService(
  service: {
    id: string;
    title: string;
    price: number;
    category: string;
    location: string;
  },
  negotiatedPrice?: number
): BookingDisplaySnapshot {
  return {
    displayTitle: service.title,
    displayPrice: negotiatedPrice ?? service.price,
    displayCategory: service.category,
    displayLocation: service.location,
    displaySource: "service",
    displayTargetId: service.id,
  };
}

export function snapshotFromRequest(
  request: {
    id: string;
    title: string;
    budget: number;
    category: string;
    location: string;
  },
  proposedPrice: number | null
): BookingDisplaySnapshot {
  return {
    displayTitle: request.title,
    displayPrice: proposedPrice ?? request.budget,
    displayCategory: request.category,
    displayLocation: request.location,
    displaySource: "request",
    displayTargetId: request.id,
  };
}

function displayFromSnapshot(
  booking: BookingForDisplay,
  viewer: BookingDisplayViewer
): BookingDisplayInfo | null {
  if (!booking.displayTitle) return null;

  const source =
    booking.displaySource === "request" ? "request" : ("service" as const);
  const targetId = booking.displayTargetId ?? "unknown";

  if (source === "service") {
    return {
      source: "service",
      id: targetId,
      title: booking.displayTitle,
      price: booking.displayPrice ?? 0,
      category: booking.displayCategory ?? "Service",
      location: booking.displayLocation ?? "—",
      href: `/services/${targetId}`,
      archived: false,
    };
  }

  const liveRequest = booking.requestResponse?.request;
  return {
    source: "request",
    id: targetId,
    title: booking.displayTitle,
    price: booking.displayPrice ?? 0,
    category: booking.displayCategory ?? "Demande",
    location: booking.displayLocation ?? "—",
    href: liveRequest
      ? `/requests/${liveRequest.id}`
      : archivedRequestHref(viewer),
    archived: !liveRequest,
  };
}

export function getBookingDisplayInfo(
  booking: BookingForDisplay,
  options?: { viewer?: BookingDisplayViewer }
): BookingDisplayInfo {
  const viewer = options?.viewer ?? "client";

  if (booking.service) {
    return {
      source: "service",
      id: booking.service.id,
      title: booking.displayTitle ?? booking.service.title,
      price: booking.displayPrice ?? booking.service.price,
      category: booking.displayCategory ?? booking.service.category,
      location: booking.displayLocation ?? booking.service.location,
      href: `/services/${booking.service.id}`,
    };
  }

  if (booking.requestResponse) {
    const { request } = booking.requestResponse;
    if (request) {
      return {
        source: "request",
        id: request.id,
        title: request.title,
        price: booking.requestResponse.proposedPrice ?? request.budget,
        category: request.category,
        location: request.location,
        href: `/requests/${request.id}`,
      };
    }

    const fromSnapshot = displayFromSnapshot(booking, viewer);
    if (fromSnapshot) return fromSnapshot;

    return {
      source: "request",
      id: "request",
      title: "Prestation via demande client",
      price: booking.requestResponse.proposedPrice ?? 0,
      category: "Demande",
      location: "—",
      href: archivedRequestHref(viewer),
      archived: true,
    };
  }

  const fromSnapshot = displayFromSnapshot(booking, viewer);
  if (fromSnapshot) return fromSnapshot;

  return {
    source: "service",
    id: "unknown",
    title: "Réservation",
    price: 0,
    category: "Service",
    location: "—",
    href: "/dashboard/client",
  };
}

export function resolveBookingDate(desiredDate: Date | null): Date {
  if (desiredDate && desiredDate > new Date()) {
    return desiredDate;
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
}

export function resolveBookingSchedule(request: {
  desiredDate: Date | null;
  desiredSlotStart?: string | null;
  desiredSlotEnd?: string | null;
}): { date: Date; slotStart: string | null; slotEnd: string | null } {
  const base = resolveBookingDate(request.desiredDate);
  const slotStart = request.desiredSlotStart ?? null;
  const slotEnd = request.desiredSlotEnd ?? null;

  return {
    date: applySlotToDate(base, slotStart),
    slotStart,
    slotEnd,
  };
}
