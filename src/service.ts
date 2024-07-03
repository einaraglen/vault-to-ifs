import { cleanup_unused_revisions } from "@procedures/handlers/cleanup";
import { extract_transaction } from "@procedures/handlers/extract";
import { insert_unique_parts, insert_structure_chain, set_structure_state } from "@procedures/handlers/insert";
import { IFSConfig, IFSConnection } from "@providers/ifs/connection";
import { MSSQLConfig, MSSQLConnection } from "@providers/mssql/connection";
import { CommitError, IFSError, MSSQLError } from "@utils/error";
import chalk from "chalk";

const ifs_config: IFSConfig = {
  server: process.env.IFS_HOST,
  user: process.env.IFS_USERNAME,
  password: process.env.IFS_PASSWORD,
  version: process.env.IFS_VERSION,
  os_user: process.env.IFS_OS_USER,
};

const mssql_config: MSSQLConfig = {
  domain: process.env.MSSQL_DOMAIN,
  user: process.env.MSSQL_USERNAME,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST,
  database: process.env.MSSQL_DATABASE,
};

export const run = async () => {
  console.log("##", chalk.blueBright("START"), "##");
  const mssql_connection = new MSSQLConnection(mssql_config);
  const mssql = await mssql_connection.instance();

  const ifs_connection = new IFSConnection(ifs_config);
  const ifs = await ifs_connection.instance();

  let tx = await ifs.BeginTransaction();
  let revisions: Record<string, string> = {};

  // known bad export: "369e2024-9459-4b3d-904b-cb83c468b8d3"

  const test_transaction = "369e2024-9459-4b3d-904b-cb83c468b8d3"//"12946823-811d-46fb-a7ef-7cde948e7fe6";

  try {
    const { root, unique_parts, struct_chain } = await extract_transaction(mssql, test_transaction);

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

    console.log("Completed", chalk.greenBright(root.ItemNumber))

    //await set_transaction_status(mssql, "AcceptedBOM", test_transaction)

  } catch (err) {
    await tx.Rollback();

    if (err instanceof IFSError) {
      console.log(chalk.redBright(`${err.name}:`), chalk.yellowBright(`${err.func}:`), err.message)
      console.log(JSON.stringify(err.row))
    } else if (err instanceof MSSQLError) {
      console.log(chalk.redBright(`${err.name}:`), chalk.yellowBright(`${err.func}:`), err.message)
    } else if (err instanceof CommitError) {
      console.log(chalk.redBright(`${err.name}:`), chalk.yellowBright(`${err.stage}:`), err.message)
    } else {
      console.log("MAJOR FAILURE", err)
    }

    await cleanup_unused_revisions(ifs, revisions);
    //await set_transaction_status(mssql, "Error", test_transaction)
  }

  await ifs_connection.close();
  await mssql_connection.close();
  console.log("##", chalk.blueBright("END"), "##");
};
