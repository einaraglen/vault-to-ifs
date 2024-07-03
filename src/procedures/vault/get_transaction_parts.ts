import { ConnectionPool } from "mssql";
import { MSSQLRow } from "@providers/mssql/types";

const sql = (root: string, transaction: string) => `
SELECT * FROM [ERP].[dbo].[BOM]
WHERE [TransactionId] = '${transaction}'
AND [ItemNumber] IS NOT NULL
AND [ItemNumber] != '${root}'
--AND [ItemNumber] = '2207084'
ORDER BY [ItemNumber];
`;

export const get_transaction_parts = async (client: ConnectionPool, root: string, transaction: string): Promise<MSSQLRow[]> => {
    const res = await client.query(sql(root, transaction));

    return res.recordset
}