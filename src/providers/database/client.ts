import sql from "mssql";
import { Transaction } from "../../utils/transaction";
import { Future } from "../../utils/future";

export class MSSQLClient {
  private pool?: sql.ConnectionPool;
  private connected: Future;
  private created: Future;
  private transaction: Transaction;

  constructor(transaction: Transaction) {
    this.transaction = transaction;
    this.connected = new Future();
    this.created = new Future();

    const options: sql.config = {
      user: process.env.MSSQL_USERNAME,
      password: process.env.MSSQL_PASSWORD,
      server: process.env.MSSQL_HOST,
      database: process.env.MSSQL_DATABASE,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };

    sql
      .connect(options)
      .then((pool) => {
        this.pool = pool;
        this.connected.complete();
      })
      .catch(() => this.connected.error("Failed to connecto to MSSQL Server"));
  }

  public async createTransaction() {
    try {
      await this.connected.wait();

      const pool = this.getPool();

      const request = await pool.request();

      request.input("part", this.transaction.event.name);
      request.input("transaction", this.transaction.id);
      request.input("state", 0);

      const statement = `
            INSERT INTO [dbo].[transactions] ([part], [transactionId], [state], [receivedTime])
            VALUES (
                @part, 
                @transaction, 
                @state, 
                GETDATE()
            )
        `;

      await request.query(statement);
      this.created.complete();
    } catch (err) {
      console.error("## MSSQL ERROR ##\n", err);
    }
  }

  public async startTransaction() {
    try {
      await this.connected.wait();
      await this.created.wait();

      const pool = this.getPool();

      const request = await pool.request();

      request.input("part", this.transaction.event.name);
      request.input("transaction", this.transaction.id);
      request.input("state", 1);

      const statement = `
            UPDATE [dbo].[transactions] 
            SET 
                [state] = @state, 
                [startTime] = GETDATE() 
            WHERE 
                [part] = @part 
                AND [transactionId] = @transaction
        `;

      await request.query(statement);
    } catch (err) {
      console.error("## MSSQL ERROR ##\n", err);
    }
  }

  public async updateTransaction(count: number) {
    try {
      await this.connected.wait();
      await this.created.wait();

      const pool = this.getPool();

      const request = await pool.request();

      request.input("part", this.transaction.event.name);
      request.input("transaction", this.transaction.id);
      request.input("count", count);

      const statement = `
            UPDATE [dbo].[transactions] 
            SET 
                [count] = @count 
            WHERE 
                [part] = @part 
                AND [transactionId] = @transaction
        `;

      await request.query(statement);
    } catch (err) {
      console.error("## MSSQL ERROR ##\n", err);
    }
  }

  public async completeTransaction() {
    try {
      await this.connected.wait();
      await this.created.wait();

      const pool = this.getPool();

      const request = await pool.request();

      request.input("part", this.transaction.event.name);
      request.input("transaction", this.transaction.id);
      request.input("state", 2);

      const statement = `
            UPDATE [dbo].[transactions] 
            SET 
                [state] = @state, 
                [endTime] = GETDATE() 
            WHERE 
                [part] = @part 
                AND [transactionId] = @transaction
        `;

      await request.query(statement);

      await this.close();
    } catch (err) {
      console.error("## MSSQL ERROR ##\n", err);
    }
  }

  public async failTransaction(error: any) {
    try {
      await this.connected.wait();
      await this.created.wait();

      const pool = this.getPool();

      const request = await pool.request();

      request.input("part", this.transaction.event.name);
      request.input("transaction", this.transaction.id);
      request.input("state", -1);
      request.input("error", this.errorToJSON(error));

      const statement = `
            UPDATE [dbo].[transactions] 
            SET 
                [state] = @state, 
                [endTime] = GETDATE(), 
                [errorDetails] = @error
            WHERE 
                [part] = @part 
                AND [transactionId] = @transaction
        `;

      await request.query(statement);

      await this.close();
    } catch (err) {
      console.error("## MSSQL ERROR ##\n", err);
    }
  }

  public errorToJSON(error: any) {
    const obj: Record<string, any> = {};

    if ("name" in error) {
      obj["name"] = error.name
    }

    if ("message" in error) {
      obj["message"] = error.message
    }

    if ("func" in error) {
      obj["function"] = error.func
    }

    if ("row" in error) {
      obj["issues"] = error.row
    }

    if ("stack" in error) {
      obj["stack"] = error.stack
    }

    return JSON.stringify(obj)
  }

  public async close() {
    if (this.pool != null) {
      await this.pool.close();
    }
  }

  private getPool() {
    if (this.pool == null) {
      throw new Error("Failed to get MSSQL Client");
    }

    return this.pool;
  }
}
