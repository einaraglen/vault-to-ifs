import { cleanup_unused_revisions } from "./handlers/cleanup";
import { extract_transaction } from "./handlers/extract";
import { insert_structure_chain, insert_unique_parts, set_structure_state } from "./handlers/insert";
import { IFSConfig, IFSConnection } from "./providers/ifs/connection";
import { MSSQLConfig, MSSQLConnection } from "./providers/mssql/connection";

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
  const mssql_connection = new MSSQLConnection(mssql_config);
  const mssql = await mssql_connection.instance();

  const ifs_connection = new IFSConnection(ifs_config);
  const ifs = await ifs_connection.instance();

  let tx = await ifs.BeginTransaction();
  let revisions: Record<string, string> = {};

  const test_transaction = "80bcf532-9a68-474f-a8ee-3e7f10653555";

  try {
    const { root, unique_parts, struct_chain } = await extract_transaction(mssql, test_transaction);

    console.log("Starting", root.c01);

    const { new_revisions, created_revisions } = await insert_unique_parts(tx, unique_parts);

    const parts_commit = await tx.Commit();

    if (!parts_commit.ok) {
      throw new Error(parts_commit.errorText);
    }

    revisions = { ...created_revisions };

    await insert_structure_chain(tx, struct_chain, new_revisions);

    await set_structure_state(tx, struct_chain, new_revisions);

    const struct_commit = await tx.Commit();

    if (!struct_commit.ok) {
      throw new Error(struct_commit.errorText);
    }

    console.log("Done", root.c01);

    // write ERP lines as "AcceptedBOM"

  } catch (err) {
    console.error("\n\n", err, "\n\n");
    await tx.Rollback();
    await cleanup_unused_revisions(ifs, revisions);
  }

  await ifs_connection.close();
  await mssql_connection.close();
  console.log("Program End");
};
