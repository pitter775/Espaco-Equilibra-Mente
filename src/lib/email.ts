import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { AppUser } from "./types";

type EmailResult = {
  sent: boolean;
  skipped?: boolean;
  error?: string;
};

let resendClient: Resend | null = null;
let smtpTransport: nodemailer.Transporter | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

function getSmtpTransport() {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) return null;

  const port = Number(process.env.MAIL_PORT || 587);
  smtpTransport ??= nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: port === 465,
    requireTLS: process.env.MAIL_ENCRYPTION === "tls",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  return smtpTransport;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] ?? char);
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://www.espacoequilibramente.com.br";
}

function fromAddress() {
  const smtpFrom = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME;
  if (smtpFrom) {
    const name = process.env.MAIL_FROM_NAME || "Espaco Equilibra Mente";
    return `${name} <${smtpFrom}>`;
  }

  return process.env.RESEND_FROM_EMAIL || "Espaco Equilibra Mente <onboarding@resend.dev>";
}

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  const smtp = getSmtpTransport();
  if (smtp) {
    try {
      await smtp.sendMail({ from: fromAddress(), to, subject, html });
      return { sent: true };
    } catch (error) {
      return { sent: false, error: error instanceof Error ? error.message : "Erro ao enviar e-mail por SMTP." };
    }
  }

  const resend = getResend();
  if (!resend) return { sent: false, skipped: true, error: "SMTP/RESEND nao configurado." };

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
  });

  if (error) return { sent: false, error: error.message };
  return { sent: true };
}

function pendingHtml(user: AppUser) {
  const name = escapeHtml(user.name || "cliente");
  return `
    <h2 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;color:#222;">Cadastro recebido, ${name}</h2>
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;color:#444;line-height:1.6;">
      Recebemos seu cadastro no <strong>Espaco Equilibra Mente</strong> e ele esta em analise.
    </p>
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;color:#444;line-height:1.6;">
      Assim que a equipe aprovar seus dados, voce recebera uma nova confirmacao por e-mail.
    </p>
    <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;color:#444;line-height:1.6;">
      Duvidas? Fale com a gente pelo WhatsApp:
      <a href="https://wa.me/5511979691269" style="color:#28a745;text-decoration:none;">(11) 97969-1269</a>
    </p>
  `;
}

function approvalHtml(user: AppUser) {
  const baseUrl = siteUrl().startsWith("http") ? siteUrl() : `https://${siteUrl()}`;
  const url = `${baseUrl}/cadastro-aprovado/${user.id}`;
  const name = escapeHtml(user.name || "cliente");
  return `
    <h2 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;color:#222;">Parabens, ${name}!</h2>
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;color:#444;line-height:1.6;">
      Seu cadastro no <strong>Espaco Equilibra Mente</strong> foi <strong>aprovado</strong>.
    </p>
    <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;color:#444;line-height:1.6;">A partir de agora voce pode:</p>
    <ul style="margin:0 0 16px 18px;padding:0;font-family:Arial,Helvetica,sans-serif;color:#444;line-height:1.6;">
      <li>Fazer e acompanhar suas reservas</li>
      <li>Visualizar seus dados</li>
      <li>Garantir seus horarios favoritos</li>
    </ul>
    <a href="${url}" style="display:inline-block;background:#28a745;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">Acessar o site</a>
    <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;color:#888;font-size:12px;line-height:1.6;">
      Se o botao nao funcionar, copie e cole este link no navegador:<br><span style="color:#555;">${url}</span>
    </p>
    <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;color:#444;line-height:1.6;">
      Duvidas? Fale com a gente pelo WhatsApp:
      <a href="https://wa.me/5511979691269" style="color:#28a745;text-decoration:none;">(11) 97969-1269</a>
    </p>
  `;
}

function rejectionHtml(user: AppUser) {
  const name = escapeHtml(user.name || "cliente");
  return `
    <h2 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;color:#222;">Ola, ${name}</h2>
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;color:#444;line-height:1.6;">
      Seu cadastro no <strong>Espaco Equilibra Mente</strong> foi analisado e nao foi aprovado neste momento.
    </p>
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;color:#444;line-height:1.6;">
      Para revisar as informacoes ou entender o motivo, fale com a equipe pelo WhatsApp.
    </p>
    <a href="https://wa.me/5511979691269" style="display:inline-block;background:#d9534f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">Falar com a equipe</a>
  `;
}

export async function sendApprovalStatusEmail(user: AppUser, status: "aprovado" | "reprovado"): Promise<EmailResult> {
  if (!user.email) return { sent: false, skipped: true, error: "Usuario sem e-mail." };

  const subject = status === "aprovado" ? "Seu cadastro foi aprovado!" : "Atualizacao do seu cadastro";
  const html = status === "aprovado" ? approvalHtml(user) : rejectionHtml(user);
  return sendEmail(user.email, subject, html);
}

export async function sendPendingRegistrationEmail(user: AppUser): Promise<EmailResult> {
  if (!user.email) return { sent: false, skipped: true, error: "Usuario sem e-mail." };
  return sendEmail(user.email, "Recebemos seu cadastro", pendingHtml(user));
}
