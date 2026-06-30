/** Masque OTP, liens de reset et contenus sensibles dans les logs dev. */
export function redactEmailDevLog(payload: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): { to: string; subject: string; preview: string } {
  let subject = payload.subject;

  if (/^\d{6}\s*—/.test(subject) || subject.includes("code de vérification")) {
    subject = "[OTP] — code masqué dans les logs";
  }

  if (subject.toLowerCase().includes("réinitialisation")) {
    subject = "[reset] — lien masqué dans les logs";
  }

  const raw = payload.text ?? payload.html ?? "";
  let preview = "[contenu masqué]";

  if (raw.includes("reset-password") || raw.includes("#token=")) {
    preview = "[lien de réinitialisation — consultez la boîte mail]";
  } else if (/\b\d{6}\b/.test(raw) && /code|vérification/i.test(raw)) {
    preview = "[code OTP — consultez la boîte mail]";
  } else if (raw.length > 0) {
    preview = raw.length > 120 ? `${raw.slice(0, 120)}…` : raw;
  }

  return { to: payload.to, subject, preview };
}
