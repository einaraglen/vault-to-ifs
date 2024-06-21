import { create_catalog_part } from "./procedures/parts/create_catalog_part";
import { create_engineering_part } from "./procedures/parts/create_engineering_part";
import { create_inventory_part } from "./procedures/parts/create_inventory_part";
import { create_purchase_part } from "./procedures/parts/create_purchase_part";
import { create_sales_part } from "./procedures/parts/create_sales_part";
import { add_technical_spesification } from "./procedures/parts/add_technical_spesification";
import { get_master_parts } from "./procedures/vault/get_master_parts";
import { IFSConfig, IFSConnection } from "./providers/ifs/connection";
import { MSSQLConfig, MSSQLConnection } from "./providers/mssql/connection";
import { convert_to_in_mesage } from "./procedures/vault/convert_to_in_message";
import { Connection } from "./providers/ifs/internal/Connection";

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

const mssql_config: MSSQLConfig = {
  domain: process.env.MSSQL_DOMAIN,
  user: process.env.MSSQL_USERNAME,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST,
  database: process.env.MSSQL_DATABASE,
};

let ifs_connection: IFSConnection;
let sql_connection: MSSQLConnection;
let tx: Connection 

const init = async () => {
  ifs_connection = new IFSConnection(ifs_config);
  sql_connection = new MSSQLConnection(mssql_config);
}

const cleanup = async () => {
  await tx.Rollback()
  await ifs_connection.close()
  await sql_connection.close()
}

export const run = async () => {
  init()

  const ifs = await ifs_connection.instance();
  const sql = await sql_connection.instance();

  const res = await get_master_parts(sql);
  const messages = res.map((row) => convert_to_in_mesage(row))

  tx = (await ifs.BeginTransaction()).connection;

  let cursor: any | null = null;

  try {
    
    console.log("Starting Transfer")

    for (const message of messages) {
      cursor = message;

      await create_catalog_part(tx, message); // WORKING!
      process.stdout.write(`\tcatalog\t`);

      await add_technical_spesification(tx, message); // WORKING!
      process.stdout.write(`\ttechnical\t`);

      await create_engineering_part(tx, message); // insufficient privileges
      process.stdout.write(`\engineering\t`);

      await create_inventory_part(tx, message); // WORKING!
      process.stdout.write(`\tinventory\t`);

      await create_purchase_part(tx, message); // WORKING!
      process.stdout.write(`\purchase\t`);

      await create_sales_part(tx, message); // WORKING!
      process.stdout.write(`\tsales\t`);

      // quick fix to prevent AccessProvider rate-limit
      await new Promise((res) => setTimeout(res, 500))

      console.log("Completed", message.c01)
    }

    console.log("Completed Transfer")

    // await tx.Commit(); // commit changes to database write
    await tx.Rollback(); // rollback to prevent database write
  } catch (err) {
    // fliush
    console.log("")
    console.error(err);

    if (cursor) {
      console.log(cursor)
    }
  } finally {
    await tx.Rollback();
    await tx.EndSession();
  }

  await cleanup();
};


process.on('exit', async (code) => {
  await cleanup();
  console.log(`About to exit with code: ${code}`);
});