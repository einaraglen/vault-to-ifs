import { ConnectionPool, IResult } from "mssql";
import { MSSQLRow } from "@providers/mssql/types";
import { MSSQLError } from "@utils/error";

const sql = (limit: number) => `
    SELECT TOP (${limit}) [TransactionId]
    FROM [ERP].[dbo].[BOM]
    WHERE [ParentItemNumber] IS NULL
        AND [ItemNumber] IS NOT NULL
        AND [ReleaseDate] != ''
        AND [ChildCount] != '0'
        AND [Status] = 'Posted'
    ORDER BY [ReleaseDate] ASC;
`;

export const get_latest_transactions = async (client: ConnectionPool, limit: number): Promise<MSSQLRow[]> => {
  let res: IResult<any>;

  try {
    res = await client.query(sql(limit));
  } catch (err) {
    throw new MSSQLError((err as Error).message, "Get Root Part");
  }

  return res.recordset;
};
