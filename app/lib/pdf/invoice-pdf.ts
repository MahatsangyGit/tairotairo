import type { InvoiceData } from "@/lib/invoice";

/**
 * Générateur PDF minimaliste et autoporté (aucune dépendance externe).
 * Produit un PDF A4 valide avec texte, lignes et rectangles, utilisant
 * Helvetica + WinAnsiEncoding (supporte les accents français Latin-1).
 */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;

type Op = string;

/**
 * Encode une chaîne pour une literal PDF avec WinAnsiEncoding.
 * Les accents Latin-1 (é, É, à, °, ·…) sont écrits en échappements octaux
 * `\xxx` pour que le flux reste ASCII — sinon TextEncoder (UTF-8) produit
 * `Ã©` / `Ã‰` à l'affichage.
 */
function escapePdfString(s: string): string {
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;

    // Remplacements hors WinAnsi / typographiques
    if (cp === 0x2019 || cp === 0x2018) {
      out += "'";
      continue;
    }
    if (cp === 0x2013 || cp === 0x2014) {
      out += "-";
      continue;
    }
    if (cp === 0x2026) {
      out += "...";
      continue;
    }
    if (cp === 0x0153) {
      out += "oe";
      continue;
    }
    if (cp === 0x0152) {
      out += "OE";
      continue;
    }
    if (cp === 0x00A0) {
      out += " ";
      continue;
    }

    // ASCII imprimable
    if (cp >= 0x20 && cp <= 0x7e) {
      if (ch === "\\" || ch === "(" || ch === ")") {
        out += `\\${ch}`;
      } else {
        out += ch;
      }
      continue;
    }

    // Latin-1 / WinAnsi (0xA0–0xFF) : échappement octal PDF
    if (cp >= 0xa0 && cp <= 0xff) {
      out += `\\${cp.toString(8).padStart(3, "0")}`;
      continue;
    }

    // Caractère non supporté : ignoré
  }
  return out;
}

class PdfBuilder {
  private ops: Op[] = [];
  private x: number = 0;
  private y: number = 0;

  private cmd(s: string) {
    this.ops.push(s);
  }

  text(
    x: number,
    y: number,
    content: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {}
  ) {
    const size = opts.size ?? 10;
    const font = opts.bold ? "/F2" : "/F1";
    if (opts.color) {
      this.cmd(
        `${opts.color[0]} ${opts.color[1]} ${opts.color[2]} rg`
      );
    }
    const escaped = escapePdfString(content);
    this.cmd(
      `BT ${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escaped}) Tj ET`
    );
    if (opts.color) {
      this.cmd("0 0 0 rg");
    }
    this.x = x;
    this.y = y;
  }

  /** Texte multiligne : renvoie la position Y après la dernière ligne. */
  textBlock(
    x: number,
    y: number,
    content: string,
    opts: { size?: number; bold?: boolean; lineHeight?: number; maxLineWidth?: number } = {}
  ): number {
    const size = opts.size ?? 10;
    const lineHeight = opts.lineHeight ?? size + 3;
    const maxLineWidth = opts.maxLineWidth ?? PAGE_W - MARGIN - x;

    const words = content.split(/\s+/);
    const lines: string[] = [];
    let current = "";

    // Estimation grossière de largeur (Helvetica ~ 0.5 * size par caractère moyen).
    const widthOf = (s: string) => s.length * size * 0.5;

    for (const w of words) {
      const candidate = current ? `${current} ${w}` : w;
      if (widthOf(candidate) > maxLineWidth && current) {
        lines.push(current);
        current = w;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);

    let cy = y;
    for (const line of lines) {
      this.text(x, cy, line, { size, bold: opts.bold });
      cy -= lineHeight;
    }
    return cy;
  }

  line(x1: number, y1: number, x2: number, y2: number, width = 0.6) {
    this.cmd(`${width} w 0 0 0 RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  rectFill(x: number, y: number, w: number, h: number, color: [number, number, number]) {
    this.cmd(`${color[0]} ${color[1]} ${color[2]} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f 0 0 0 rg`);
  }

  rectStroke(x: number, y: number, w: number, h: number, width = 0.6) {
    this.cmd(`${width} w 0 0 0 RG ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  build(): string {
    return this.ops.join("\n");
  }
}

function buildInvoicePdf(data: InvoiceData): Buffer {
  const b = new PdfBuilder();
  const brand: [number, number, number] = [0.024, 0.580, 0.580]; // #069494
  const light: [number, number, number] = [0.96, 0.97, 0.98];
  const top = PAGE_H - MARGIN;

  // ── En-tête : plateforme / émetteur ──────────────────────────────────────
  b.rectFill(MARGIN, top - 56, 280, 56, brand);
  b.text(MARGIN + 14, top - 24, data.platform.name, { size: 20, bold: true, color: [1, 1, 1] });
  b.text(MARGIN + 14, top - 42, data.platform.parentCompany, { size: 10, color: [1, 1, 1] });

  // Bloc facture (à droite)
  const rightX = PAGE_W - MARGIN - 200;
  b.text(rightX, top - 8, "FACTURE", { size: 22, bold: true, color: brand });
  b.text(rightX, top - 24, `N° ${data.invoiceNumber}`, { size: 11 });
  b.text(rightX, top - 38, `Date : ${data.invoiceDateLabel}`, { size: 10 });

  b.line(MARGIN, top - 70, PAGE_W - MARGIN, top - 70, 1);

  // ── Émetteur / Destinataire ──────────────────────────────────────────────
  const partyY = top - 90;
  b.text(MARGIN, partyY, "ÉMETTEUR (prestataire)", { size: 9, bold: true, color: brand });
  b.text(MARGIN, partyY - 14, data.seller.name, { size: 11, bold: true });
  let sy = partyY - 28;
  if (data.seller.phone) {
    b.text(MARGIN, sy, `Tél : ${data.seller.phone}`, { size: 9 });
    sy -= 12;
  }
  sy = b.textBlock(MARGIN, sy, data.seller.email, { size: 9 });

  b.text(rightX, partyY, "CLIENT", { size: 9, bold: true, color: brand });
  b.text(rightX, partyY - 14, data.buyer.name, { size: 11, bold: true });
  let by = partyY - 28;
  if (data.buyer.phone) {
    b.text(rightX, by, `Tél : ${data.buyer.phone}`, { size: 9 });
    by -= 12;
  }
  by = b.textBlock(rightX, by, data.buyer.email, { size: 9, maxLineWidth: 190 });

  // ── Désignation ──────────────────────────────────────────────────────────
  const tableTop = Math.min(sy, by) - 28;
  b.text(MARGIN, tableTop, "Détail de la prestation", { size: 12, bold: true, color: brand });

  const colDescX = MARGIN;
  const colAmountX = PAGE_W - MARGIN - 130;
  const rowH = 22;
  const tableY = tableTop - 18;

  // En-tête du tableau
  b.rectFill(colDescX, tableY - rowH, PAGE_W - MARGIN - colDescX, rowH, light);
  b.text(colDescX + 8, tableY - 15, "Désignation", { size: 10, bold: true });
  b.text(colAmountX, tableY - 15, "Montant", { size: 10, bold: true });
  b.line(colDescX, tableY - rowH, PAGE_W - MARGIN, tableY - rowH, 0.6);

  // Ligne prestation
  const line1Y = tableY - rowH - rowH;
  b.text(colDescX + 8, line1Y + 7, data.service.title, { size: 10 });
  b.text(colDescX + 8, line1Y - 5, `${data.service.category} · ${data.service.location}`, { size: 8 });
  b.text(colAmountX, line1Y + 2, data.amountLabel, { size: 10 });
  b.line(colDescX, line1Y - rowH + 4, PAGE_W - MARGIN, line1Y - rowH + 4, 0.4);

  // Ligne date
  const line2Y = line1Y - rowH - 4;
  b.text(colDescX + 8, line2Y + 2, `Date de prestation : ${data.service.dateLabel}`, { size: 9 });
  b.line(colDescX, line2Y - rowH + 12, PAGE_W - MARGIN, line2Y - rowH + 12, 0.6);

  // ── Total ────────────────────────────────────────────────────────────────
  const totalY = line2Y - rowH;
  b.rectFill(colAmountX - 110, totalY - rowH, PAGE_W - MARGIN - colAmountX + 110, rowH, brand);
  b.text(colAmountX - 100, totalY - 15, "TOTAL À VERSER", { size: 10, bold: true, color: [1, 1, 1] });
  b.text(colAmountX, totalY - 15, data.amountLabel, { size: 11, bold: true, color: [1, 1, 1] });

  // ── Informations de règlement ─────────────────────────────────────────────
  const payY = totalY - rowH - 24;
  b.text(MARGIN, payY, "Modalités de règlement", { size: 10, bold: true, color: brand });
  b.text(MARGIN, payY - 14, `Mode de paiement : ${data.paymentMethod}`, { size: 9 });
  b.text(MARGIN, payY - 26, `Référence transaction : ${data.transactionReference}`, { size: 9 });
  b.text(
    MARGIN,
    payY - 38,
    "Versement effectué via la plateforme Tairo ampio après validation de la prestation par le client.",
    { size: 9 }
  );

  // ── Pied de page ─────────────────────────────────────────────────────────
  const footerY = MARGIN + 24;
  b.line(MARGIN, footerY + 14, PAGE_W - MARGIN, footerY + 14, 0.4);
  b.text(
    MARGIN,
    footerY,
    `${data.platform.name} — ${data.platform.parentCompany}. Facture générée automatiquement après validation client et libération des fonds.`,
    { size: 7 }
  );

  return renderPdf(b.build());
}

/** Assemble le document PDF complet avec xref. */
function renderPdf(contentStream: string): Buffer {
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(contentStream);

  const objects: Uint8Array[] = [];
  const offsets: number[] = [];

  // Objet 1 : Catalog
  objects.push(encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"));
  // Objet 2 : Pages
  objects.push(
    encoder.encode("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
  );
  // Objet 3 : Page
  objects.push(
    encoder.encode(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`
    )
  );
  // Objet 4 : Content stream
  objects.push(
    encoder.encode(
      `<< /Length ${contentBytes.length} >>\nstream\n` +
        contentStream +
        "\nendstream"
    )
  );
  // Objet 5 : Font Helvetica
  objects.push(
    encoder.encode(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
    )
  );
  // Objet 6 : Font Helvetica-Bold
  objects.push(
    encoder.encode(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
    )
  );

  let pdf = "%PDF-1.4\n";
  const headerBytes = encoder.encode(pdf);
  let pos = headerBytes.length;

  const chunks: Uint8Array[] = [headerBytes];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pos);
    const objHeader = encoder.encode(`${i + 1} 0 obj\n`);
    const objFooter = encoder.encode("\nendobj\n");
    chunks.push(objHeader, objects[i], objFooter);
    pos += objHeader.length + objects[i].length + objFooter.length;
  }

  const xrefStart = pos;
  const xrefHeader = encoder.encode(
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  );
  chunks.push(xrefHeader);

  for (const off of offsets) {
    chunks.push(encoder.encode(`${off.toString().padStart(10, "0")} 00000 n \n`));
  }

  const trailer = encoder.encode(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  );
  chunks.push(trailer);

  return Buffer.concat(chunks);
}

export function generateInvoicePdf(data: InvoiceData): Buffer {
  return buildInvoicePdf(data);
}
