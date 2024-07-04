export class StateMachine {
  private transactions: Set<string>;
  private active: boolean

  constructor() {
    this.transactions = new Set<string>();
    this.active = false;
  }

  public enqueue_transaction(transaction: string) {
    this.transactions.add(transaction);
  };

  public dequeue_transaction() {
    const transaction = this.transactions.values().next().value as string;
    this.transactions.delete(transaction);
    return transaction;
  };

  public is_empty = () => this.transactions.size === 0;
  public is_busy = () => this.active
  public start_job = () => this.active = true;
  public stop_job = () => this.active = false;
}
