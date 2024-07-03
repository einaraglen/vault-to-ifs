import { ConnectionPool } from "mssql";
import { MSSQLRow } from "@providers/mssql/types";

const sql = (transaction: string) => `
SELECT *
FROM [ERP].[dbo].[BOM]
WHERE [ParentItemNumber] IS NULL
    AND [ItemNumber] IS NOT NULL
    AND [TransactionId] = '${transaction}';
`;

export const get_root_part = async (client: ConnectionPool, transaction: string): Promise<MSSQLRow[]> => {
    const res = await client.query(sql(transaction));

    return res.recordset
}