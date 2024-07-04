import cron from "node-cron";
import { StateMachine } from "./state_machine";
import { get_latest_transactions } from "@procedures/vault/get_latest_transactions";
import { Providers } from "./providers";
import { ConnectionPool } from "mssql";

export class Pooling {
  private state: StateMachine;
  private connection: ConnectionPool | null = null;

  constructor(state_: StateMachine) {
    this.state = state_;
  }

  public async start() {
    this.connection = await Providers.get_mssql();
    cron.schedule("*/5 * * * * *", this.get_latest);
  }

  public async get_latest() {
    try {
      if (this.state.is_busy()) {
        return;
      }

      const res = await get_latest_transactions(this.connection!, 10);
      console.log("Found", res.length, "Transactions")
      res.forEach((row) => this.state.enqueue_transaction(row.TransactionId!))
    } catch (err) {
      console.error(err);
    }
  }
}
