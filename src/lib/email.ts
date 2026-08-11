import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { AppUser, Reserva, Sala } from "./types";

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

function adminApprovalEmails() {
  const raw = process.env.ADMIN_APPROVAL_EMAIL || process.env.ADMIN_EMAIL || "pitter775@gmail.com";
  return raw.split(",").map((email) => email.trim()).filter(Boolean);
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

function adminPendingHtml(user: AppUser) {
  const baseUrl = siteUrl().startsWith("http") ? siteUrl() : `https://${siteUrl()}`;
  const directApprovalPath = `/admin/usuarios?usuario=${encodeURIComponent(String(user.id))}`;
  const approvalUrl = `${baseUrl}/login?redirect_to=${encodeURIComponent(directApprovalPath)}`;
  const name = escapeHtml(user.name || "cliente");
  const email = escapeHtml(user.email || "-");
  const telefone = escapeHtml(user.telefone || "-");
  const documento = escapeHtml(user.documento_tipo || "-");

  return `
    <div style="margin:0;padding:28px;background:#eef6eb;font-family:Arial,Helvetica,sans-serif;color:#263326;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 18px 45px rgba(32,53,34,0.12);">
        <div style="padding:28px 28px 18px;border-bottom:1px solid #e4ecdf;">
          <p style="margin:0 0 8px;color:#216c2e;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">Novo cadastro pendente</p>
          <h1 style="margin:0;color:#203522;font-size:26px;line-height:1.25;">${name}</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 18px;color:#526052;line-height:1.7;">Um novo usuario completou o cadastro e precisa de aprovacao no painel administrativo.</p>
          <div style="background:#f7fbf5;border:1px solid #e0ebdc;border-radius:8px;padding:18px;margin:0 0 22px;">
            <p style="margin:0 0 8px;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin:0 0 8px;"><strong>Telefone:</strong> ${telefone}</p>
            <p style="margin:0;"><strong>Documento:</strong> ${documento}</p>
          </div>
          <a href="${approvalUrl}" style="display:inline-block;background:#216c2e;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:bold;">Abrir cadastro para aprovacao</a>
          <p style="margin:16px 0 0;color:#7a857a;font-size:12px;line-height:1.6;">Se o botao nao funcionar, copie e cole este link:<br><span style="color:#526052;">${approvalUrl}</span></p>
        </div>
      </div>
    </div>
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

function formatDate(value?: string | null) {
  if (!value) return "Data nao informada";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return escapeHtml(value);
  return `${day}/${month}/${year}`;
}

function formatTime(value?: string | null) {
  return String(value ?? "").slice(0, 5) || "Horario nao informado";
}

function reservationConfirmedHtml(user: AppUser, reserva: Reserva & { sala?: Sala | null }) {
  const baseUrl = siteUrl().startsWith("http") ? siteUrl() : `https://${siteUrl()}`;
  const logoUrl = `${baseUrl}/assets/img/logoescuro.png`;
  const reservationsUrl = `${baseUrl}/cliente/reservas`;
  const name = escapeHtml(user.name || "cliente");
  const salaNome = escapeHtml(reserva.sala?.nome || `Sala ${reserva.sala_id}`);
  const data = formatDate(reserva.data_reserva);
  const horario = `${formatTime(reserva.hora_inicio)} as ${formatTime(reserva.hora_fim)}`;

  return `
    <div style="margin:0;padding:28px;background:#eef6eb;font-family:Arial,Helvetica,sans-serif;color:#263326;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 18px 45px rgba(32,53,34,0.12);">
        <div style="padding:28px 28px 18px;text-align:center;border-bottom:1px solid #e4ecdf;">
          <img src="${logoUrl}" alt="Espaco Equilibra Mente" style="max-width:190px;height:auto;margin-bottom:18px;" />
          <h1 style="margin:0;color:#203522;font-size:26px;line-height:1.25;">Reserva confirmada</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 18px;color:#526052;line-height:1.7;">Ola, ${name}. Seu pagamento foi aprovado e sua reserva esta confirmada.</p>
          <div style="background:#f7fbf5;border:1px solid #e0ebdc;border-radius:8px;padding:18px;margin:0 0 22px;">
            <p style="margin:0 0 8px;"><strong>Sala:</strong> ${salaNome}</p>
            <p style="margin:0 0 8px;"><strong>Data:</strong> ${data}</p>
            <p style="margin:0 0 8px;"><strong>Horario:</strong> ${horario}</p>
            <p style="margin:0;"><strong>Status:</strong> Confirmada</p>
          </div>
          <a href="${reservationsUrl}" style="display:inline-block;background:#216c2e;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:bold;">Ver minhas reservas</a>
          <p style="margin:20px 0 0;color:#526052;line-height:1.7;">Em caso de duvidas, fale com a equipe pelo WhatsApp: <a href="https://wa.me/5511979691269" style="color:#216c2e;text-decoration:none;">(11) 97969-1269</a>.</p>
        </div>
      </div>
    </div>
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
  const userEmail = await sendEmail(user.email, "Recebemos seu cadastro", pendingHtml(user));
  const adminResults = await Promise.all(
    adminApprovalEmails().map((email) => sendEmail(email, `Novo cadastro para aprovacao: ${user.name || user.email}`, adminPendingHtml(user))),
  );

  if (!userEmail.sent) return userEmail;
  const failedAdminEmail = adminResults.find((result) => !result.sent);
  if (failedAdminEmail) return failedAdminEmail;
  return { sent: true };
}

export async function sendReservationConfirmedEmail(user: AppUser, reserva: Reserva & { sala?: Sala | null }): Promise<EmailResult> {
  if (!user.email) return { sent: false, skipped: true, error: "Usuario sem e-mail." };
  return sendEmail(user.email, "Sua reserva foi confirmada", reservationConfirmedHtml(user, reserva));
}
