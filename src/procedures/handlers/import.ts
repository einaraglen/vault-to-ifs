import { Connection } from "../../providers/ifs/internal/Connection";
import { CommitError } from "../../utils/error";
import { Providers } from "../../utils/providers";
import { build_structure_chain, ExportPart, filter_unique_parts } from "../../utils/tools";
import { check_obsolete } from "./check_obsolete";
import { insert_structure_chain, insert_unique_parts, set_structure_state } from "./insert";

type ExportMessage = { id: string; parts: ExportPart[] };

enum Stage {
  Parts = "Parts",
  Structs = "Structs",
}

export class Insert {
  private tx: Connection;
  private message: ExportMessage;

  constructor(id: string, parts: ExportPart[]) {
    this.message = { id, parts };
    this.tx = Providers.IFS.BeginTransaction();
  }

  public async start() {
    try {
      // 16% parts can be used with more than a single REV
      // check_revision_deviation(this.message.parts)

      const { map, list, root } = filter_unique_parts(this.message.parts);
      const struct_chain = build_structure_chain(this.message.parts, map);

      const revisions = await insert_unique_parts(this.tx, list);

      await check_obsolete(this.tx, list, revisions)

      // Only add structure if there is any
      if (list.length > 1) {
        await insert_structure_chain(this.tx, struct_chain, revisions, root);
  
        await set_structure_state(this.tx, struct_chain, revisions);
      }

      await this.try_commit(Stage.Structs);

      await this.try_close();
    } catch (err) {
      await this.try_rollback();
      await this.try_close();

      throw err;
    }
  }

  private async try_commit(stage: string) {
    const res = await this.tx.Commit();

    if (!res.ok) {
      throw new CommitError(res.errorText, stage);
    }
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
}
