import { MailerConnection } from "../providers/smtp/client";
import { IFSConnection } from "../providers/ifs/connection";
import { Connection } from "../providers/ifs/internal/Connection";

export class Providers {
  private static ifs: Connection;
  private static mailer: MailerConnection;

  public static async register(connection: IFSConnection | MailerConnection): Promise<void> {
    if (connection instanceof IFSConnection) {
      this.ifs = await connection.instance();
      console.log("[Connected] IFS PLSQL")
    } else if (connection instanceof MailerConnection) {
      this.mailer = connection;
      console.log("[Connected] Node Mailer")
    } else {
      throw new Error("Cannot register unsupported provider");
    }
  };

  public static get IFS() {
    if (this.ifs == null) {
        throw new Error("Cannot get IFSConnection since provider is null")
    }
    return this.ifs;
  };

  public static get Mailer() {
    if (this.mailer == null) {
        throw new Error("Cannot get MailerConnection since provider is null")
    }
    return this.mailer.instance();
  };

  public static close() {
    if (this.ifs != null) {
        this.ifs.EndSession();
    }

    if (this.mailer != null) {
        this.mailer.close();
    }
  }
}
