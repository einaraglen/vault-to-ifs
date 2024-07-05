import { cleanup_unused_revisions } from "@procedures/handlers/cleanup";
import { extract_transaction } from "@procedures/handlers/extract";
import { insert_structure_chain, insert_unique_parts, set_structure_state } from "@procedures/handlers/insert";
import { set_transaction_status } from "@procedures/vault/set_transaction_status";
import { Connection } from "@providers/ifs/internal/Connection";
import { CommitError, IFSError, MSSQLError } from "@utils/error";
import { Providers } from "@utils/providers";
import chalk from "chalk";

enum Stage {
  Parts = "Parts",
  Structs = "Structs",
}

export class Import {
  private tx: Connection;
  private transaction: string;
  private revisions: Record<string, string>;

  constructor(transaction_: string) {
    this.tx = Providers.IFS.BeginTransaction();
    this.transaction = transaction_;
    this.revisions = {};
  }

  public async start() {
    console.log(chalk.greenBright("Importing"), chalk.blueBright(this.transaction))
    try {
      const { unique_parts, struct_chain } = await extract_transaction(Providers.MSSQL, this.transaction);

      const { new_revisions, created_revisions } = await insert_unique_parts(this.tx, unique_parts);

      await this.try_commit(Stage.Parts);

      this.set_revisions(created_revisions);

      await insert_structure_chain(this.tx, struct_chain, new_revisions);

      await set_structure_state(this.tx, struct_chain, new_revisions);

      await this.try_commit(Stage.Structs);

      await this.set_accepted();
      console.log(chalk.greenBright("Completed"), chalk.blueBright(this.transaction))
    } catch (err) {
      await this.try_rollback();
      await this.remove_revisions();
      await this.set_error();
      await this.send_notification(err)

      this.print_error_message(err);
    } finally {
      await this.try_close();
    }
  }

  private async try_commit(stage: string) {
    const res = await this.tx.Commit();

    if (!res.ok) {
      throw new CommitError(res.errorText, stage);
    }
  }

  private set_revisions(revisions_: Record<string, string>) {
    this.revisions = { ...revisions_ };
  }

  private remove_revisions() {
    return cleanup_unused_revisions(Providers.IFS, this.revisions);
  }

  private async try_rollback() {
    try {
        await this.tx.Rollback()
    } catch(err) {
        console.error("Failed to rollback Transaction", err)
    }
  }

  private async try_close() {
    try {
        await this.tx.EndSession()
    } catch(err) {
        console.error("Failed to end Transaction Session", err)
    }
  }

  private print_error_message(err: any) {
    if (err instanceof IFSError) {
      console.log(chalk.gray(JSON.stringify(err.row, null, 2)));
      console.log(chalk.redBright(`${err.name}:`), chalk.yellowBright(`${err.func}:`), err.message);
    } else if (err instanceof MSSQLError || err instanceof CommitError) {
      console.log(chalk.redBright(`${err.name}:`), chalk.yellowBright(`${err.func}:`), err.message);
    } else {
      console.error("MAJOR FAILURE", err);
    }
  }

  private async set_accepted() {
    await set_transaction_status(Providers.MSSQL, "AcceptedBOM", this.transaction)
  }

  private async set_error() {
    try {
        await set_transaction_status(Providers.MSSQL, "Error", this.transaction)
    } catch (err) {
        console.error("Failed to set Transaction Error", err)
    }
  }

  private async send_notification(err: any) {
    try {
        await Providers.Mailer.send_error_notification(err, this.transaction)
    } catch(err) {
        console.error("Failed to send Error Notification", err)
    }
  }
}
