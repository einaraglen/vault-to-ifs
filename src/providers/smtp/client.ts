import { render } from "@react-email/components";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import ErrorEmail from "../../../emails/Error";
import { Transaction } from "../../utils/transaction";

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

  public async send(error: any, transaction: Transaction) {
    try {
      const args = { file: transaction.event.name, transaction: transaction.id, error };
      const html = render(ErrorEmail(args));
      await this.client.sendMail(this.error_message(transaction.event.name, html));
    } catch (err) {
      console.error("Mail Error:", err);
    }
  }

  public close() {
    this.client.close();
  }

  private error_message(file: string, html: string) {
    const args: any = {
      from: "vault.import@seaonicsas.onmicrosoft.com",
      to: process.env.SMTP_GROUP,
      subject: `Failed Import - ${file}`,
      html: html,
    };

    return args;
  }
}
