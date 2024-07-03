import { ConnectionPool } from "mssql";
import { MSSQLRow } from "@providers/mssql/types";

const sql = (limit: number) => `
SELECT TOP (${limit}) *
FROM [ERP].[dbo].[BOM]
WHERE [ParentItemNumber] IS NULL
    AND [ItemNumber] IS NOT NULL
    AND [ReleaseDate] != ''
    AND [ChildCount] != '0'
    --AND [Status] = 'Posted'
ORDER BY [ReleaseDate] DESC;
`;

export const get_latest_transactions = async (client: ConnectionPool, limit: number): Promise<MSSQLRow[]> => {
    const res = await client.query(sql(limit));

    return res.recordset
}