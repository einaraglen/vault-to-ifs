import { get_latest_transactions } from "@procedures/vault/get_latest_transactions";
import cron from "node-cron";
import { Providers } from "./providers";
import { Queue } from "./queue";
import { Import } from "@procedures/handlers/import";
import chalk from "chalk";

const TRANSACTION_LIMIT = 10;
const EVERY_5_SECONDS = "*/5 * * * * *";

export class Polling {
  private lock: boolean;
  private queue: Queue;

  constructor() {
    this.lock = false;
    this.queue = new Queue();
  }

  public start() {
    cron.schedule(EVERY_5_SECONDS, () => {
      this.fetch_transactions();
    });
  }

  private async fetch_transactions() {
    if (this.lock) {
      return;
    }

    this.lock = true;
    await this.get_transactions();
    this.lock = false;

    if (!this.queue.is_empty()) {
      this.run_jobs();
    }
  }

  private async run_jobs() {
    this.lock = true;

    while (!this.queue.is_empty()) {
      const transaction = this.queue.dequeue_transaction();
      await new Import(transaction).start();
    }

    this.lock = false;
  }

  private async get_transactions() {
    const transactions = await get_latest_transactions(Providers.MSSQL, TRANSACTION_LIMIT).catch(() => null);

    if (transactions != null) {
      this.queue.enqueue_transactions(transactions);
    }
  }
}
