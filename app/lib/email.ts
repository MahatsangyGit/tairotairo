import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
import { BRAND_PRIMARY, PARENT_COMPANY, SITE_NAME } from "@/lib/site";

const EMAIL_FROM = process.env.EMAIL_FROM ?? `${SITE_NAME} <noreply@tairotairo.mg>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function getTransport() {
  if (!isEmailConfigured()) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<boolean> {
  const transport = getTransport();

  if (!transport) {
    console.info("[email:dev]", { to, subject, text: text ?? html });
    return true;
  }

  try {
    await transport.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, ""),
    });
    return true;
  } catch (error) {
    console.error("[sendEmail]", error);
    return false;
  }
}

export function emailLayout(title: string, body: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h1 style="color:${BRAND_PRIMARY};font-size:20px;margin-bottom:16px">${title}</h1>
      ${body}
      <p style="margin-top:24px;font-size:12px;color:#6b7280">
        <a href="${APP_URL}" style="color:${BRAND_PRIMARY}">${SITE_NAME}</a> — Marketplace de services à Madagascar<br />
        <span style="font-size:11px;color:#9ca3af">Édité par ${PARENT_COMPANY}</span>
      </p>
    </div>
  `;
}

export async function sendOtpEmail(to: string, name: string, code: string) {
  return sendEmail({
    to,
    subject: `${code} — Votre code de vérification ${SITE_NAME}`,
    html: emailLayout(
      "Vérification de votre email",
      `
        <p>Bonjour ${name},</p>
        <p>Votre code de vérification est :</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:${BRAND_PRIMARY}">${code}</p>
        <p>Ce code expire dans <strong>10 minutes</strong>.</p>
        <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
      `
    ),
    text: `Bonjour ${name}, votre code ${SITE_NAME} est : ${code} (valide 10 minutes).`,
  });
}

export async function sendBookingCreatedEmail(params: {
  to: string;
  recipientName: string;
  serviceTitle: string;
  dateLabel: string;
  dashboardUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Nouvelle réservation sur ${SITE_NAME}`,
    html: emailLayout(
      "Nouvelle réservation",
      `
        <p>Bonjour ${params.recipientName},</p>
        <p>Vous avez reçu une nouvelle demande de réservation pour <strong>${params.serviceTitle}</strong>.</p>
        <p>Date prévue : ${params.dateLabel}</p>
        <p><a href="${params.dashboardUrl}" style="color:${BRAND_PRIMARY}">Voir dans votre espace pro →</a></p>
      `
    ),
  });
}

export async function sendBookingConfirmedEmail(params: {
  to: string;
  recipientName: string;
  serviceTitle: string;
  dateLabel: string;
  dashboardUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Réservation confirmée — ${SITE_NAME}`,
    html: emailLayout(
      "Réservation confirmée",
      `
        <p>Bonjour ${params.recipientName},</p>
        <p>Votre réservation pour <strong>${params.serviceTitle}</strong> a été confirmée.</p>
        <p>Date prévue : ${params.dateLabel}</p>
        <p><a href="${params.dashboardUrl}" style="color:${BRAND_PRIMARY}">Suivre ma réservation →</a></p>
      `
    ),
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: `Bienvenue sur ${SITE_NAME}`,
    html: emailLayout(
      "Bienvenue !",
      `
        <p>Bonjour ${name},</p>
        <p>Votre compte ${SITE_NAME} a été créé. Vérifiez votre email depuis votre profil pour activer toutes les fonctionnalités.</p>
        <p><a href="${APP_URL}/auth/login" style="color:${BRAND_PRIMARY}">Se connecter →</a></p>
      `
    ),
  });
}

export { APP_URL, isEmailConfigured };
