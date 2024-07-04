import { IFSConnection } from "@providers/ifs/connection";
import { MSSQLConnection } from "@providers/mssql/connection";
import { MailerConnection } from "@providers/smtp/client";

export class Providers {
  private static ifs: IFSConnection;
  private static mssql: MSSQLConnection;
  private static mailer: MailerConnection;

  public static register(connection: IFSConnection | MSSQLConnection | MailerConnection) {
    if (connection instanceof IFSConnection) {
      this.ifs = connection;
    } else if (connection instanceof MSSQLConnection) {
      this.mssql = connection;
    } else if (connection instanceof MailerConnection) {
      this.mailer = connection;
    } else {
      throw new Error("Cannot register unsupported provider");
    }
  };

  public static get_ifs() {
    if (this.ifs == null) {
        throw new Error("Cannot get IFSConnection since provider is null")
    }
    return this.ifs.instance();
  };

  public static get_mssql() {
    if (this.mssql == null) {
        throw new Error("Cannot get MSSQLConnection since provider is null")
    }
    return this.mssql.instance();
  };

  public static get_mailer() {
    if (this.mailer == null) {
        throw new Error("Cannot get MailerConnection since provider is null")
    }
    return this.mailer.instance();
  };

  public static async close() {
    if (this.ifs != null) {
        await this.ifs.close();
    }

    if (this.mssql != null) {
        await this.mssql.close();
    }

    if (this.mailer != null) {
        this.mailer.close();
    }
  }
}
