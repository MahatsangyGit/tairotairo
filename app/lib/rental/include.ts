export const rentalBookingInclude = {
  equipment: { select: { id: true, title: true, photoKeys: true } },
  transaction: {
    select: {
      id: true,
      status: true,
      amount: true,
      depositAmount: true,
    },
  },
  serviceBooking: {
    select: {
      id: true,
      status: true,
      date: true,
      slotStart: true,
      slotEnd: true,
      displayTitle: true,
    },
  },
} as const;
