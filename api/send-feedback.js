const nodemailer = require("nodemailer");

/**
 * Vercel serverless function responsável por enviar e-mails com o feedback dos usuários.
 * Espera um corpo em JSON com os campos:
 * - type: "bug" | "suggestion" (string obrigatória)
 * - name, email, message, page, userAgent
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Método não suportado." });
  }

  const {
    type,
    name = "",
    email = "",
    message = "",
    page = "",
    userAgent = "",
  } = req.body || {};

  if (!type || !message || typeof message !== "string") {
    return res.status(400).json({ error: "Dados de feedback inválidos." });
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return res.status(400).json({ error: "A descrição não pode estar vazia." });
  }

  try {
    const transporter = createTransporter();
    const emailPayload = buildEmailPayload({
      type,
      name,
      email,
      message: trimmedMessage,
      page,
      userAgent,
    });

    await transporter.sendMail(emailPayload);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro ao enviar feedback:", error);
    return res.status(500).json({ error: "Não foi possível enviar o feedback." });
  }
};

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Variáveis de ambiente SMTP não configuradas.");
  }

  const secure =
    typeof process.env.SMTP_SECURE === "string"
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function buildEmailPayload({
  type,
  name,
  email,
  message,
  page,
  userAgent,
}) {
  const subjectPrefix =
    type === "bug" ? "[Binário em Palavras] Bug reportado" : "[Binário em Palavras] Sugestão recebida";
  const subject = subjectPrefix;

  const safeName = sanitize(name);
  const safeEmail = sanitize(email);
  const safeMessage = sanitize(message);
  const safePage = sanitize(page);
  const safeUserAgent = sanitize(userAgent);

  const html = `
    <h2>${subjectPrefix}</h2>
    <p><strong>Tipo:</strong> ${sanitize(type)}</p>
    ${safeName ? `<p><strong>Nome:</strong> ${safeName}</p>` : ""}
    ${safeEmail ? `<p><strong>E-mail:</strong> ${safeEmail}</p>` : ""}
    <p><strong>Mensagem:</strong></p>
    <p>${safeMessage.replace(/\n/g, "<br />")}</p>
    ${safePage ? `<p><strong>Página:</strong> <a href="${safePage}">${safePage}</a></p>` : ""}
    ${safeUserAgent ? `<p><strong>Navegador:</strong> ${safeUserAgent}</p>` : ""}
  `;

  const text = [
    subjectPrefix,
    `Tipo: ${type}`,
    safeName ? `Nome: ${safeName}` : "",
    safeEmail ? `E-mail: ${safeEmail}` : "",
    "Mensagem:",
    message,
    safePage ? `Página: ${page}` : "",
    safeUserAgent ? `Navegador: ${userAgent}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    from: process.env.FEEDBACK_FROM || process.env.SMTP_USER,
    to: process.env.FEEDBACK_TO || "souzacarvalhosamuel@gmail.com",
    replyTo: safeEmail || undefined,
    subject,
    text,
    html,
  };
}

function sanitize(value) {
  if (!value) {
    return "";
  }
  return String(value)
    .slice(0, 1200)
    .replace(/[&<>"'`]/g, (char) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "`": "&#96;",
      };
      return map[char] || char;
    });
}
