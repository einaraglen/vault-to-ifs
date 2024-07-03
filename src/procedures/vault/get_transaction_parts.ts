import { ConnectionPool, IResult } from "mssql";
import { MSSQLRow } from "@providers/mssql/types";
import { MSSQLError } from "@utils/error";

const sql = (root: string, transaction: string) => `
    SELECT * FROM [ERP].[dbo].[BOM]
    WHERE [TransactionId] = '${transaction}'
    AND [ItemNumber] IS NOT NULL
    AND [ItemNumber] != '${root}'
    ORDER BY [ItemNumber];
`;

export const get_transaction_parts = async (client: ConnectionPool, root: string, transaction: string): Promise<MSSQLRow[]> => {
  let res: IResult<any>;

  try {
    res = await client.query(sql(root, transaction));
  } catch (err) {
    throw new MSSQLError((err as Error).message, "Get Transaction Parts");
  }

  return res.recordset;
};
