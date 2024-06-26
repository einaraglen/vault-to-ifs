import { IFSConfig, IFSConnection } from "./providers/ifs/connection";
import { create_rev_structure } from "./procedures/bom/create_rev_structure";

/**
 * To Insert Parts from Vault to IFS the following procedure can be followed:
 *
 * -- Insert Parts --
 * 1. Create Part Catalog
 * 2. Add Technical Spesfication
 * 3. Create Engineering Part
 * 4. Create Inventory Part
 * 5. Create Purchase Part
 * 6. Create Sales Part
 *
 * -- Build BOM Struct --
 * 7. Create Engineering Structure
 * 8. Create Sales Part List
 *
 * Commit if no errors
 * Rollback if errors
 */

const ifs_config: IFSConfig = {
  server: process.env.IFS_HOST,
  user: process.env.IFS_USERNAME,
  password: process.env.IFS_PASSWORD,
  version: process.env.IFS_VERSION,
  os_user: process.env.IFS_OS_USER,
};

export const run = async () => {
  const ifs_connection = new IFSConnection(ifs_config);
  const ifs = await ifs_connection.instance();
  const tx = await ifs.BeginTransaction();
  console.log("open")

  try {
    const res = await create_rev_structure(tx);

    console.log(res.bindings);
    
    await tx.Commit();
  } catch (err) {
    await tx.Rollback();
    console.error(err);
  } finally {
    await ifs_connection.close();
    console.log("close")
  }
};
