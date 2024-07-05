export class Queue {
  public list: Set<string> = new Set<string>();

  public is_empty() {
    return this.list.size === 0;
  }

  public enqueue_transactions(transactions: string[]) {
    transactions.forEach((transaction) => {
        this.list.add(transaction);
    });
  }

  public dequeue_transaction() {
    const transaction = this.list.values().next().value as string;
    this.list.delete(transaction);
    return transaction;
  }
}
