import { Connection } from "../../providers/ifs/internal/Connection";
import { sleep } from "../../utils/tools";
import { remove_revision } from "../parts/remove_revision";

export const cleanup_unused_revisions = async (connection: Connection, revisions: Record<string, string>) => {
  const tx = await connection.BeginTransaction();
  try {
    for (const [part_no, part_rev] of Object.entries(revisions)) {
      // console.log("Removing Rev", part_no, part_rev);
      await remove_revision(tx, { partNumber: part_no, revision: part_rev } as any);
      await sleep(300);
    }

    await tx.Commit();
  } catch (err) {
    console.error(err);
    await tx.Rollback();
  }
};
