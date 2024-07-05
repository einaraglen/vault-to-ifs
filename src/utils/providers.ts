import { IFSConnection } from "@providers/ifs/connection";
import { Connection } from "@providers/ifs/internal/Connection";
import { MSSQLConnection } from "@providers/mssql/connection";
import { MailerConnection } from "@providers/smtp/client";
import { ConnectionPool } from "mssql";

export class Providers {
  private static ifs: Connection;
  private static mssql: ConnectionPool;
  private static mailer: MailerConnection;

  public static async register(connection: IFSConnection | MSSQLConnection | MailerConnection) {
    if (connection instanceof IFSConnection) {
      this.ifs = await connection.instance();
    } else if (connection instanceof MSSQLConnection) {
      this.mssql = await connection.instance();
    } else if (connection instanceof MailerConnection) {
      this.mailer = connection;
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

  public static get MSSQL() {
    if (this.mssql == null) {
        throw new Error("Cannot get MSSQLConnection since provider is null")
    }
    return this.mssql;
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

    if (this.mssql != null) {
        this.mssql.close();
    }

    if (this.mailer != null) {
        this.mailer.close();
    }
  }
}
