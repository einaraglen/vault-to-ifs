import { extract_transaction } from "./handlers/extract";
import { insert_structure_chain, insert_unique_parts } from "./handlers/insert";
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

  try {
    const { root, unique_parts, struct_chain } = await extract_transaction(mssql);
    
    console.log("Starting", root.ItemNumber)
    
    const new_revisions = await insert_unique_parts(tx, unique_parts)

    await tx.Commit();

    // write ERP lines as "Accepted"

    tx = await ifs.BeginTransaction();

    await insert_structure_chain(tx, struct_chain, new_revisions)

    // write changelog to master part

    await tx.Commit();

    console.log("Done", root.ItemNumber)

    // write ERP lines as "AcceptedBOM"
  } catch (err) {
    console.error(err);
    await tx.Rollback();
  } finally {
    await ifs_connection.close()
    await mssql_connection.close();
  }
};
