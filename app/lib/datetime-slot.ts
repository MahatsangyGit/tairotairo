/** Créneaux horaires optionnels (HH:mm) en complément d'une date jour. */

const TIME_RE = /^(\d{1,2}):(\d{2})$/;

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

export function applySlotToDate(
  base: Date,
  slotStart: string | null
): Date {
  const d = new Date(base);
  if (slotStart) {
    const [h, m] = slotStart.split(":").map(Number);
    d.setHours(h, m, 0, 0);
  }
  return d;
}

export function parseDayDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d;
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
  date: Date | string,
  slotStart?: string | null,
  slotEnd?: string | null
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.toLocaleDateString("fr-MG", {
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
