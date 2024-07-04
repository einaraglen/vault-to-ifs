import { cleanup_unused_revisions } from "@procedures/handlers/cleanup";
import { extract_transaction } from "@procedures/handlers/extract";
import { insert_unique_parts, insert_structure_chain, set_structure_state } from "@procedures/handlers/insert";
import { set_transaction_status } from "@procedures/vault/set_transaction_status";
import { Connection } from "@providers/ifs/internal/Connection";
import { CommitError, IFSError, MSSQLError } from "@utils/error";
import { Providers } from "@utils/providers";
import chalk from "chalk";
import { ConnectionPool } from "mssql";

export const vault_import = async (transaction: string) => {
  console.log("##", chalk.blueBright("START"), "##");

  let mssql: ConnectionPool | null = null;
  let ifs: Connection | null = null;
  let tx: Connection | null = null;
  let revisions: Record<string, string> = {};

//   known bad export: "369e2024-9459-4b3d-904b-cb83c468b8d3"
//   const test_transaction = "369e2024-9459-4b3d-904b-cb83c468b8d3"; //"12946823-811d-46fb-a7ef-7cde948e7fe6";

  try {
    mssql = await Providers.get_mssql();

    ifs = await Providers.get_ifs();
    tx = await ifs.BeginTransaction();

    const { root, unique_parts, struct_chain } = await extract_transaction(mssql, transaction);

    const { new_revisions, created_revisions } = await insert_unique_parts(tx, unique_parts);

    const parts_commit = await tx.Commit();

    if (!parts_commit.ok) {
      throw new CommitError(parts_commit.errorText, "Parts");
    }

    revisions = { ...created_revisions };

    await insert_structure_chain(tx, struct_chain, new_revisions);

    await set_structure_state(tx, struct_chain, new_revisions);

    const struct_commit = await tx.Commit();

    if (!struct_commit.ok) {
      throw new CommitError(struct_commit.errorText, "Structure");
    }

    console.log("Completed", chalk.greenBright(root.ItemNumber));

    await set_transaction_status(mssql, "AcceptedBOM", transaction);
  } catch (err) {
    if (tx != null) {
      await tx.Rollback();
    }

    if (err instanceof IFSError) {
      console.log(chalk.gray(JSON.stringify(err.row, null, 2)));
      console.log(chalk.redBright(`${err.name}:`), chalk.yellowBright(`${err.func}:`), err.message);
    } else if (err instanceof MSSQLError) {
      console.log(chalk.redBright(`${err.name}:`), chalk.yellowBright(`${err.func}:`), err.message);
    } else if (err instanceof CommitError) {
      console.log(chalk.redBright(`${err.name}:`), chalk.yellowBright(`${err.func}:`), err.message);
    } else {
      console.log("MAJOR FAILURE", err);
    }

    if (ifs != null) {
      await cleanup_unused_revisions(ifs, revisions);
    }

    if (mssql != null) {
      await set_transaction_status(mssql, "Error", transaction).catch((err) => console.error(err));
    }

    await Providers.get_mailer().send_error_notification(err, transaction)
  } finally {
    if (tx != null) {
      await tx.EndSession();
    }
  }

  console.log("##", chalk.blueBright("END"), "##");
};
