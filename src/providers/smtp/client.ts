import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const config: SMTPTransport.Options = {
  host: process.env.SMTP_HOST,
  port: 25,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
  },
};

export const get_nodemailer = () => {
  return nodemailer.createTransport(config);
};
