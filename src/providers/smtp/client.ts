import { render } from "@react-email/components";
import ErrorEmail from "emails/Error";
import nodemailer, { Transporter } from "nodemailer";
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

export class MailerConnection {
  private client: Transporter<SMTPTransport.SentMessageInfo>;
  constructor() {
    this.client = nodemailer.createTransport(config);
  }

  public instance() {
    return this;
  }

  public send_error_notification(error: any, transaction: string) {
    return this.client.sendMail(this.error_message(render(ErrorEmail({ error, transaction }))));
  }

  public close() {
    this.client.close();
  }

  private error_message(html: string) {
    return {
      from: "vault.import@seaonicsas.onmicrosoft.com",
      to: "einar.aglen@seaonics.com",
      subject: "Failed Import",
      html: html,
    };
  }
}
