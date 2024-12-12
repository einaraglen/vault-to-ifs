import { Connection } from "./internal/Connection";

export type IFSConfig = {
  user: string;
  password: string;
  server: string;
  version: string;
  os_user: string;
};

const config: IFSConfig = {
  server: process.env.IFS_HOST,
  user: process.env.IFS_USERNAME,
  password: process.env.IFS_PASSWORD,
  version: process.env.IFS_VERSION,
  os_user: process.env.IFS_OS_USER,
};

export class IFSConnection {
  private client_: Connection;

  constructor() {
    const { server, user, password, version, os_user } = config;
    const options = { timeout: 1.8e6 } // 30 minutes
    // const options = { timeout: 60 * 1000 } // 1 minute

    this.client_ = new Connection(server, user, password, version, os_user, options);
  }

  public get client() {
    return this.client_;
  }

  public async connect() {
    const res = await this.client_.Sql(`SELECT 1 FROM DUAL`)

    if (!res.ok) {
      throw Error("Failed to connect to IFS")
    }
  }

  public begin() {
    return this.client.BeginTransaction();
  }

  public close() {
    return this.client_.EndSession();
  }
}
