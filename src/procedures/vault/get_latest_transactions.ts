import { ConnectionPool, IResult } from "mssql";
import { MSSQLRow } from "@providers/mssql/types";
import { MSSQLError } from "@utils/error";

const sql = (limit: number) => `
    SELECT TOP (${limit}) [TransactionId]
    FROM [ERP].[dbo].[BOM]
    WHERE [ParentItemNumber] IS NULL
        AND [ItemNumber] IS NOT NULL
        AND [ReleaseDate] != ''
        --AND [ChildCount] != '0'
        AND [Status] = 'Posted'
        AND [TransactionId] IS NOT NULL
    ORDER BY [ReleaseDate] ASC;
`;

export const get_latest_transactions = async (client: ConnectionPool, limit: number): Promise<string[]> => {
  let res: IResult<any>;

  await new Promise((r) => setTimeout(r, 6000))

  try {
    res = await client.query(sql(limit));
  } catch (err) {
    throw new MSSQLError((err as Error).message, "Get Latest Transactions");
  }

  return (res.recordset as MSSQLRow[]).map((row) => row.TransactionId!);
};
