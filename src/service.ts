import { create_catalog_part } from "./procedures/create_catalog_part";
import { IFSConfig, IFSConnection } from "./providers/ifs/connection";

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
  const connection = new IFSConnection(ifs_config);
  const client = await connection.instance();

  const { connection: tx } = await client.BeginTransaction();

  try {

    await create_catalog_part(tx, { part_no: "99.99.01", description: "Test 1", objid: "", objversion: "" })
    await create_catalog_part(tx, { part_no: "99.99.02", description: "Test 2", objid: "", objversion: "" })
    await create_catalog_part(tx, { part_no: "99.99.03", description: "Test 2", objid: "", objversion: "" })

    // await tx.Commit();
    await tx.Rollback()
  } catch (err) {
    console.log(err); 
  } finally {
    await tx.Rollback()
    await tx.EndSession();
    await connection.close()
  }
};