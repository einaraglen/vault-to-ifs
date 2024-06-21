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

    return this.client;
  }

  public async transaction(cb: () => Promise<void>) {
    if (this.client == null) {
      throw Error("Cannot start IFS when client is null");
    }

    const { connection: tx } = await this.client.BeginTransaction();

  }

  public async close() {
    if (this.client == null) {
      throw Error("Cannot close IFS when client is null");
    }

    return this.client.EndSession();
  }
}
