import { ERPConnection } from "./lib/erp/client";
import { IFSConnection } from "./lib/ifs/client";

export const run = async () => {
  const ERP = await ERPConnection();
  const IFS = await IFSConnection();

    // await ERP.transaction(async ({ query }) => {
    //   await query(`SELECT TOP(10) * FROM [ERP].[dbo].[BOM]`);
    //   await query(`DELETE FROM [ERP].[dbo].[BOM] WHERE [ReleasedBy] LIKE 'EIA'`);
    //   await query(`INSERT INTO Test (c1, c2) VALUES ('name', 'other')`);
    // });
 
    await IFS.transaction(async ({ query }) => {
        const res = await query(`SELECT * FROM dual`);
        console.log(res)
    })
};
