import { Insert } from "./procedures/handlers/import";
import { IFSConnection } from "./providers/ifs/connection";
import { MailerConnection } from "./providers/smtp/client";
import { Parser } from "./providers/xml/parser";
import { Providers } from "./utils/providers";
import { ChangeEvent, Watcher } from "./utils/watcher";
import { v4 as uuidv4 } from "uuid";

export type Transaction = { user: string | null; id: string }

enum Status {
  Starting = "Starting",
  Completed = "Completed",
  Failure = "Failure"
}

export class Service {
  private watcher: Watcher;

  constructor() {
    this.watcher = new Watcher();
    this.watcher.on = (event) => this.listen(event);
  }

  private async listen(event: ChangeEvent) {
    let transaction = this.getTransaction();

    try {
      await this.onEvent(event, transaction);
    } catch (err) {
      await this.onError(event, transaction, err);
    }
  }

  private async onEvent(event: ChangeEvent, transaction: Transaction) {
    this.log(Status.Starting, event, transaction)

    const parser = new Parser(event.path);
    const parts = parser.parse();

    transaction.user = parser.getUser();

    const job = new Insert(transaction.id, parts);
    await job.start();
    
    this.log(Status.Completed, event, transaction)

    this.watcher.clean(transaction.id, event.path, true);
  }

  private async onError(event: ChangeEvent, transaction: Transaction, err: any) {
    console.error(err)

    this.watcher.clean(transaction.id, event.path, false);
    await Providers.Mailer.send(err, {...transaction, file: event.name });

    this.log(Status.Failure, event, transaction)
  }

  private log(status: Status, event: ChangeEvent, transaction: Transaction) {
    console.log(`${status} [${event.name}] [${transaction.id}]`)
  }

  private getTransaction() {
    return { user: null, id: uuidv4() };
  }

  private shutdown() {
    this.watcher.close()
    process.exit(0)
  }

  public async run() {
    await Providers.register(new IFSConnection());
    await Providers.register(new MailerConnection());

    process.on("SIGTERM", () => this.shutdown())
    process.on("SIGINT", () => this.shutdown())

    this.watcher.start();
  }
}
