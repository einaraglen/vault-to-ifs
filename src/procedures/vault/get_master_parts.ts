import { ConnectionPool } from "mssql";
import { MSSQLRow } from "../../providers/mssql/types";

export const get_master_parts = async (client: ConnectionPool): Promise<MSSQLRow[]> => {
    const res = await client.query`SELECT TOP (10) * FROM [ERP].[dbo].[BOM] WHERE [ParentItemNumber] IS NOT NULL ORDER BY [LastUpdate] DESC`;

    return res.recordset
}