import sql from "mssql";

export type MSSQLConfig = {
  domain: string;
  user: string;
  password: string;
  server: string;
  database: string;
};

const config: MSSQLConfig = {
  domain: process.env.MSSQL_DOMAIN,
  user: process.env.MSSQL_USERNAME,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST,
  database: process.env.MSSQL_DATABASE,
};

export class MSSQLConnection {
  private options: sql.config | null = null;
  private client: sql.ConnectionPool | null = null;

  constructor() {
    this.options = {
        server: config.server,
        options: {
            database: config.database,
            trustServerCertificate: true,
            trustedConnection: true
        },
        driver: 'msnodesqlv8',
        authentication: {
            type: 'ntlm',
            options: {
                domain: config.domain,
                userName: config.user,
                password: config.password,
            }
        }
    }
  }

  public async instance() {
    if (this.options == null) {
      throw Error("Cannot return instance when options is null");
    }

    this.client = await sql.connect(this.options);
    return this.client;
  }

  public async close() {
    if (this.client == null) {
      throw Error("Cannot close MSSQL when client is null");
    }

    return this.client.close();
  }
}
