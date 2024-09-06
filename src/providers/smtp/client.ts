import { render } from "@react-email/components";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import ErrorEmail from "../../../emails/Error";

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
  private readonly ADMIN: string = "einar.aglen@seaonics.com";

  constructor() {
    this.client = nodemailer.createTransport(config);
  }

  public instance() {
    return this;
  }

  public async send(error: any, transaction: { file: string; user: string | null; id: string }) {
    try {
      const args = { file: transaction.file, transaction: transaction.id, error };
      const html = render(ErrorEmail(args));
      const response = await this.client.sendMail(this.error_message(transaction.user, transaction.file, html));
    } catch(err) {
      console.error(err)
    }
  }

  public close() {
    this.client.close();
  }

  private error_message(user: string | null, file: string, html: string) {
    const args: any = {
      from: "vault.import@seaonicsas.onmicrosoft.com",
      subject: `Failed Import - ${file}`,
      html: html,
    };

    if (user != null) {
      args.to = user
      // args.to = "failure-1@seaonics.com";
      args.cc = this.ADMIN;
    } else {
      args.to = this.ADMIN;
    }

    return args;
  }
}
