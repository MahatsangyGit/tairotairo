/** Créneaux horaires optionnels (HH:mm) — fuseau métier Madagascar. */

export const BUSINESS_TIMEZONE = "Indian/Antananarivo";
/** Madagascar is UTC+3 year-round (no DST). */
const BUSINESS_UTC_OFFSET = "+03:00";

const TIME_RE = /^(\d{1,2}):(\d{2})$/;
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

export function parseSlotTime(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const m = value.trim().match(TIME_RE);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function validateSlotRange(
  slotStart: string | null,
  slotEnd: string | null
): string | null {
  if (!slotStart && !slotEnd) return null;
  if (!slotStart && slotEnd) {
    return "Indiquez l'heure de début du créneau";
  }
  if (slotStart && slotEnd) {
    const [sh, sm] = slotStart.split(":").map(Number);
    const [eh, em] = slotEnd.split(":").map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      return "L'heure de fin doit être après le début";
    }
  }
  return null;
}

function calendarPartsInBusinessTz(date: Date): {
  year: string;
  month: string;
  day: string;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error("Impossible de résoudre la date métier");
  }
  return { year, month, day };
}

/** Instant in Madagascar local time for a calendar day + optional HH:mm. */
export function madagascarDateTime(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0
): Date {
  const y = String(year).padStart(4, "0");
  const mo = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return new Date(`${y}-${mo}-${d}T${hh}:${mm}:00${BUSINESS_UTC_OFFSET}`);
}

/** Journée calendaire métier (minuit → minuit lendemain, fuseau Madagascar). */
export function calendarDayRangeInBusinessTz(date: Date): {
  start: Date;
  end: Date;
} {
  const { year, month, day } = calendarPartsInBusinessTz(date);
  const start = madagascarDateTime(Number(year), Number(month), Number(day), 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function applySlotToDate(base: Date, slotStart: string | null): Date {
  const { year, month, day } = calendarPartsInBusinessTz(base);
  if (slotStart) {
    const [h, m] = slotStart.split(":").map(Number);
    return madagascarDateTime(Number(year), Number(month), Number(day), h, m);
  }
  return madagascarDateTime(Number(year), Number(month), Number(day), 0, 0);
}

export function parseDayDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const dayMatch = raw.match(DAY_RE);
  if (dayMatch) {
    const y = Number(dayMatch[1]);
    const mo = Number(dayMatch[2]);
    const d = Number(dayMatch[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return madagascarDateTime(y, mo, d, 0, 0);
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export interface ParsedScheduleInput {
  date: Date | null;
  slotStart: string | null;
  slotEnd: string | null;
  error?: string;
}

export function parseScheduleInput(body: {
  date?: unknown;
  desiredDate?: unknown;
  slotStart?: unknown;
  slotEnd?: unknown;
  desiredSlotStart?: unknown;
  desiredSlotEnd?: unknown;
}): ParsedScheduleInput {
  const date =
    parseDayDate(body.date) ?? parseDayDate(body.desiredDate);
  const slotStart =
    parseSlotTime(body.slotStart) ?? parseSlotTime(body.desiredSlotStart);
  const slotEnd =
    parseSlotTime(body.slotEnd) ?? parseSlotTime(body.desiredSlotEnd);

  const slotError = validateSlotRange(slotStart, slotEnd);
  if (slotError) return { date, slotStart, slotEnd, error: slotError };

  if ((slotStart || slotEnd) && !date) {
    return {
      date: null,
      slotStart,
      slotEnd,
      error: "Choisissez une date avant de préciser un créneau horaire",
    };
  }

  return { date, slotStart, slotEnd };
}

export function formatSchedule(
  date: Date | string | null | undefined,
  slotStart?: string | null,
  slotEnd?: string | null
): string {
  if (!date) return "Date à définir";

  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Date à définir";

  const day = d.toLocaleDateString("fr-MG", {
    timeZone: BUSINESS_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!slotStart && !slotEnd) return day;
  if (slotStart && slotEnd) return `${day}, ${slotStart} – ${slotEnd}`;
  if (slotStart) return `${day}, à partir de ${slotStart}`;
  return `${day}, avant ${slotEnd}`;
}

export function scheduleFieldsForDb(schedule: ParsedScheduleInput) {
  if (!schedule.date) {
    return {
      date: null as Date | null,
      slotStart: null as string | null,
      slotEnd: null as string | null,
    };
  }

  return {
    date: applySlotToDate(schedule.date, schedule.slotStart),
    slotStart: schedule.slotStart,
    slotEnd: schedule.slotEnd,
  };
}
