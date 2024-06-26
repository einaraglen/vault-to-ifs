import { Connection } from "./internal/Connection";

export type IFSConfig = {
  user: string;
  password: string;
  server: string;
  version: string;
  os_user: string;
};

export class IFSConnection {
  private options: IFSConfig | null = null;
  private client: Connection | null = null;

  constructor(config: IFSConfig) {
    this.options = config;
  }

  public async instance() {
    if (this.options == null) {
      throw Error("Cannot return instance when options is null");
    }

    const { server, user, password, version, os_user } = this.options;

    this.client = new Connection(server, user, password, version, os_user);

    await this.connect()

    return this.client;
  }

  private async connect() {
    if (this.client == null) {
      throw Error("Cannot connect IFS when client is null");
    }

    // Simple transaction + rollback to test connection
    const tx = await this.client.BeginTransaction()
    const res = await tx.Rollback()

    if (!res.ok) {
      throw Error(res.errorText)
    }
  }

  public async close() {
    if (this.client == null) {
      throw Error("Cannot close IFS when client is null");
    }

    return this.client.EndSession();
  }
}
