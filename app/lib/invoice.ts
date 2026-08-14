import prisma from "@/lib/prisma";
import { withBypassRls } from "@/lib/rls";
import { getBookingDisplayInfo } from "@/lib/booking-display";
import { formatSchedule } from "@/lib/datetime-slot";
import { SITE_NAME, PARENT_COMPANY } from "@/lib/site";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string; // ISO
  invoiceDateLabel: string;
  seller: {
    name: string;
    email: string;
    phone: string | null;
    nif: string | null;
    stat: string | null;
    rcs: string | null;
  };
  buyer: {
    name: string;
    email: string;
    phone: string | null;
  };
  platform: {
    name: string;
    parentCompany: string;
  };
  service: {
    title: string;
    category: string;
    location: string;
    dateLabel: string;
  };
  paymentMethod: string;
  transactionReference: string;
  amount: number;
  currency: string;
  amountLabel: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ORANGE_MONEY: "Orange Money",
  MVOLA: "MVola",
  AIRTEL_MONEY: "Airtel Money",
};

/**
 * Numéro de facture déterministe et stable : dérivé de l'identifiant de
 * transaction et de l'année de versement. Pas besoin de compteur en base.
 */
export function invoiceNumberFor(transactionId: string, releasedAt: Date): string {
  const year = releasedAt.getUTCFullYear();
  const seed = transactionId.replace(/[^a-z0-9]/gi, "");
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const suffix = hash.toString(36).toUpperCase().padStart(6, "0").slice(-6);
  return `FA-${year}-${suffix}`;
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString("fr-MG")} ${currency}`;
}

/** Récupère les données nécessaires à l'émission d'une facture prestataire. */
export async function getInvoiceData(
  bookingId: string
): Promise<InvoiceData | null> {
  return withBypassRls(async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        date: true,
        slotStart: true,
        slotEnd: true,
        displayTitle: true,
        displayPrice: true,
        displayCategory: true,
        displayLocation: true,
        service: {
          select: {
            id: true,
            title: true,
            price: true,
            category: true,
            location: true,
          },
        },
        requestResponse: {
          select: {
            proposedPrice: true,
            request: {
              select: {
                id: true,
                title: true,
                budget: true,
                category: true,
                location: true,
              },
            },
          },
        },
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        provider: {
          select: { id: true, name: true, email: true, phone: true, nif: true, stat: true, rcs: true },
        },
        transaction: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paymentMethod: true,
            releasedAt: true,
          },
        },
      },
    });

    if (!booking || !booking.transaction) return null;

    const tx = booking.transaction;
    // Facture émise uniquement après libération des fonds (versement prestataire).
    if (tx.status !== "RELEASED") return null;
    if (!tx.releasedAt) return null;

    const display = getBookingDisplayInfo(booking, { viewer: "provider" });

    return {
      invoiceNumber: invoiceNumberFor(tx.id, tx.releasedAt),
      invoiceDate: tx.releasedAt.toISOString(),
      invoiceDateLabel: tx.releasedAt.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      seller: {
        name: booking.provider.name,
        email: booking.provider.email,
        phone: booking.provider.phone,
        nif: booking.provider.nif,
        stat: booking.provider.stat,
        rcs: booking.provider.rcs,
      },
      buyer: {
        name: booking.client.name,
        email: booking.client.email,
        phone: booking.client.phone,
      },
      platform: {
        name: SITE_NAME,
        parentCompany: PARENT_COMPANY,
      },
      service: {
        title: display.title,
        category: display.category,
        location: display.location,
        dateLabel: formatSchedule(booking.date, booking.slotStart, booking.slotEnd),
      },
      paymentMethod:
        PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod,
      transactionReference: tx.id,
      amount: tx.amount,
      currency: tx.currency,
      amountLabel: formatAmount(tx.amount, tx.currency),
    };
  });
}
