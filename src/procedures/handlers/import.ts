import { Connection } from "../../providers/ifs/internal/Connection";
import { CommitError } from "../../utils/error";
import { Providers } from "../../utils/providers";
import { build_structure_chain, ExportPart, filter_unique_parts } from "../../utils/tools";
import { cleanup_unused_revisions } from "./cleanup";
import { insert_structure_chain, insert_unique_parts, set_structure_state } from "./insert";

type ExportMessage = { transaction: string; parts: ExportPart[] };

enum Stage {
  Parts = "Parts",
  Structs = "Structs",
}

export class Insert {
  private tx: Connection;
  private message: ExportMessage;
  private revisions: Record<string, string>;

  constructor(_message: ExportMessage) {
    this.message = _message;
    this.tx = Providers.IFS.BeginTransaction();
    this.revisions = {};
  }

  public async start() {
    console.log(`Importing [${this.message.transaction}]`);
    try {
      const { map, list } = filter_unique_parts(this.message.parts);
      const struct_chain = build_structure_chain(this.message.parts, map);

      const { new_revisions, created_revisions } = await insert_unique_parts(this.tx, list);

      await this.try_commit(Stage.Parts);

      this.set_revisions(created_revisions);

      await insert_structure_chain(this.tx, struct_chain, new_revisions);

      await set_structure_state(this.tx, struct_chain, new_revisions);

      await this.try_commit(Stage.Structs);

      console.log(`Completed [${this.message.transaction}]`);
    } catch (err) {
      await this.try_rollback();
      await this.remove_revisions();
      await this.send_notification(err);

      console.error(err);
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
      await this.tx.Rollback();
    } catch (err) {
      console.error("Failed to rollback Transaction", err);
    }
  }

  private async try_close() {
    try {
      await this.tx.EndSession();
    } catch (err) {
      console.error("Failed to end Transaction Session", err);
    }
  }

  private async send_notification(err: any) {
    try {
      await Providers.Mailer.send_error_notification(err, this.message.transaction);
    } catch (err) {
      console.error("Failed to send Error Notification", err);
    }
  }
}
