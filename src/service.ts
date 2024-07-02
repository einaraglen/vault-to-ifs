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

  const test_transaction = "8dff7873-7ffb-43f3-9f58-15ac0d18a1ab";

  try {
    const { root, unique_parts, struct_chain } = await extract_transaction(mssql, test_transaction);

    console.log("Starting", root.c06);

    const { new_revisions, created_revisions } = await insert_unique_parts(tx, unique_parts);

    // await tx.Rollback();
    await tx.Commit();

    revisions = { ...created_revisions };

    // write ERP lines as "Accepted"

    tx = await ifs.BeginTransaction();

    await insert_structure_chain(tx, struct_chain, new_revisions);

    await set_structure_state(tx, struct_chain, new_revisions);

    await tx.Commit();

    console.log("Done", root.c06);

    // write ERP lines as "AcceptedBOM"
  } catch (err) {
    console.error(err);
    await tx.Rollback();
    await cleanup_unused_revisions(tx, revisions)
  } finally {
    await ifs_connection.close();
    await mssql_connection.close();
  }
};
