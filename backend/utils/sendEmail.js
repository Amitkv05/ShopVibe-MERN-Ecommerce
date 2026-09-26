import nodemailer from "nodemailer";

function createTransporter() {
  const config = {
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  if (process.env.SMTP_SERVICE) {
    config.service = process.env.SMTP_SERVICE;
  } else {
    config.host = process.env.SMTP_HOST;
    config.port = Number(process.env.SMTP_PORT) || 587;
    config.secure = String(process.env.SMTP_SECURE).toLowerCase() === "true";
  }

  return nodemailer.createTransport(config);
}

export const sendEmail = async ({ email, subject, message, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("SMTP credentials are not configured");
  }

  const transporter = createTransporter();
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text: message,
    html,
  });
};
