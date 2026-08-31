/** Shared Prisma include fragments for booking API responses. */

export const bookingServiceSelect = {
  id: true,
  title: true,
  price: true,
  category: true,
  location: true,
} as const;

export const bookingRequestResponseSelect = {
  proposedPrice: true,
  status: true,
  request: {
    select: {
      id: true,
      title: true,
      budget: true,
      category: true,
      location: true,
    },
  },
} as const;

export const bookingTransactionSelect = {
  id: true,
  amount: true,
  status: true,
  paymentMethod: true,
  escrowedAt: true,
  releasedAt: true,
  refundedAt: true,
} as const;

/** Include used by single-booking mutations (PATCH status, schedule, pay). */
export const bookingMutationInclude = {
  service: { select: bookingServiceSelect },
  requestResponse: { select: bookingRequestResponseSelect },
  client: {
    select: { id: true, name: true, phone: true, email: true },
  },
  provider: {
    select: { id: true, name: true, phone: true },
  },
  transaction: { select: bookingTransactionSelect },
} as const;

/** Role-specific include for listing bookings. */
export function bookingIncludeForRole(role: string) {
  if (role === "CLIENT") {
    return {
      service: { select: bookingServiceSelect },
      requestResponse: { select: bookingRequestResponseSelect },
      provider: {
        select: { id: true, name: true, phone: true },
      },
      review: {
        select: { id: true, rating: true },
      },
      transaction: { select: bookingTransactionSelect },
    } as const;
  }

  return {
    service: { select: bookingServiceSelect },
    requestResponse: { select: bookingRequestResponseSelect },
    client: {
      select: { id: true, name: true, phone: true, email: true },
    },
    transaction: { select: bookingTransactionSelect },
  } as const;
}
