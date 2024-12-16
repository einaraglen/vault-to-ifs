import { MailerConnection } from "./providers/smtp/client";
import { Status, Transaction } from "./utils/transaction";
import { Watcher } from "./utils/watcher";

export class Service {
  private watcher: Watcher;
  private mailer: MailerConnection;

  constructor() {
    this.watcher = new Watcher();
    this.mailer = new MailerConnection()

    this.watcher.on = (transaction) => this.onFile(transaction);
  }

  private async onFile(transaction: Transaction) {
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

    this.watcher.clean(transaction, true);
  }

  private async onError(transaction: Transaction, err: any) {
    transaction.close(Status.Failure)

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