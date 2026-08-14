import { describe, expect, it } from "vitest";
import type { InvoiceData } from "@/lib/invoice";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";

function sampleInvoice(
  seller: Partial<InvoiceData["seller"]> = {}
): InvoiceData {
  return {
    invoiceNumber: "FA-2026-ABC123",
    invoiceDate: "2026-08-14T00:00:00.000Z",
    invoiceDateLabel: "14 août 2026",
    seller: {
      name: "Jean Rakoto",
      email: "jean@example.com",
      phone: null,
      nif: null,
      stat: null,
      rcs: null,
      ...seller,
    },
    buyer: {
      name: "Marie Client",
      email: "marie@example.com",
      phone: null,
      nif: null,
      stat: null,
      rcs: null,
      companyAddress: null,
      isProfessional: false,
    },
    platform: {
      name: "Tairo ampio",
      parentCompany: "Tairo",
    },
    service: {
      title: "Plomberie",
      category: "Maison",
      location: "Antananarivo",
      dateLabel: "14/08/2026",
    },
    paymentMethod: "Orange Money",
    transactionReference: "tx_1",
    amount: 50000,
    currency: "MGA",
    amountLabel: "50 000 MGA",
  };
}

describe("facture PDF identifiants légaux", () => {
  it("affiche NIF et STAT formaté quand le prestataire les a renseignés", () => {
    const pdf = generateInvoicePdf(
      sampleInvoice({
        nif: "3002064702",
        stat: "41002522015000152",
      })
    );
    const text = pdf.toString("latin1");
    expect(text).toContain("NIF : 3002064702");
    expect(text).toContain("STAT : 41002 52 2015 0 00152");
  });

  it("affiche NIF et STAT du client professionnel", () => {
    const pdf = generateInvoicePdf({
      ...sampleInvoice(),
      buyer: {
        name: "Andry SARL",
        email: "contact@andry.mg",
        phone: "0340000000",
        nif: "3002064702",
        stat: "41002522015000152",
        rcs: "RCS Antananarivo A 2024 00031",
        companyAddress: "Lot II A 12 Antananarivo",
        isProfessional: true,
      },
    });
    const text = pdf.toString("latin1");
    expect(text).toContain("Andry SARL");
    expect(text).toContain("CLIENT \\(SOCI");
    expect(text).toContain("NIF : 3002064702");
    expect(text).toContain("STAT : 41002 52 2015 0 00152");
  });

  it("n'affiche pas NIF/STAT s'ils sont absents", () => {
    const pdf = generateInvoicePdf(sampleInvoice());
    const text = pdf.toString("latin1");
    expect(text).not.toContain("NIF :");
    expect(text).not.toContain("STAT :");
  });
});
