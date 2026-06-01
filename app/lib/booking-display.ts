export interface BookingDisplayInfo {
  source: "service" | "request";
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  href: string;
}

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
    };
  } | null;
}

export function getBookingDisplayInfo(
  booking: BookingForDisplay
): BookingDisplayInfo | null {
  if (booking.service) {
    return {
      source: "service",
      id: booking.service.id,
      title: booking.service.title,
      price: booking.service.price,
      category: booking.service.category,
      location: booking.service.location,
      href: `/services/${booking.service.id}`,
    };
  }

  if (booking.requestResponse) {
    const { request } = booking.requestResponse;
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

  return null;
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
