import { MailerConnection } from "./providers/smtp/client";
import { Status, Transaction } from "./utils/transaction";
import { ChangeEvent, Watcher } from "./utils/watcher";

export class Service {
  private watcher: Watcher;
  private mailer: MailerConnection;

  private transactions: Map<string, Transaction> = new Map()

  constructor() {
    this.watcher = new Watcher();
    this.mailer = new MailerConnection()

    this.watcher.on = (event) => this.onFile(event);
  }

  private async onFile(event: ChangeEvent) {
    const transaction = new Transaction(event)
    this.transactions.set(transaction.id, transaction)

    try {
      await this.onEvent(transaction);
    } catch (err) {
      await this.onError(transaction, err);
    } finally {
      this.watcher.unlock()
    }
  }

  private async onEvent(transaction: Transaction) {
    await transaction.exec()
    transaction.close(Status.Completed)
    this.transactions.delete(transaction.id)

    this.watcher.clean(transaction, true);
  }

  private async onError(transaction: Transaction, err: any) {
    transaction.close(Status.Failure)
    this.transactions.delete(transaction.id)

    this.watcher.clean(transaction, false);
    this.mailer.send(err, transaction);
  }

  public async run() {
    process.on('SIGTERM', () => {
      console.log("Shutting down service...")
      this.watcher.close()
      this.mailer.close()
      process.exit();
    });

    process.on('SIGINT', () => {
      console.log("Shutting down service...")
      this.watcher.close()
      this.mailer.close()
      process.exit();
    });

    this.watcher.start();
  }
}