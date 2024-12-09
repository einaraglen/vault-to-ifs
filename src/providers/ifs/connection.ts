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
    this.client_ = new Connection(server, user, password, version, os_user);
  }

  public get client() {
    return this.client_;
  }

  public async connect() {
    const tx = await this.client_.BeginTransaction()
    const res = await tx.Rollback()

    if (!res.ok) {
      throw Error(res.errorText)
    }
  }

  public begin() {
    return this.client.BeginTransaction();
  }

  public close() {
    return this.client_.EndSession();
  }
}
