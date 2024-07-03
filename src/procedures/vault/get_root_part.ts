import { ConnectionPool, IResult } from "mssql";
import { MSSQLRow } from "@providers/mssql/types";
import { MSSQLError } from "@utils/error";

const sql = (transaction: string) => `
    SELECT TOP(1) *
    FROM [ERP].[dbo].[BOM]
    WHERE [ParentItemNumber] IS NULL
    AND [ItemNumber] IS NOT NULL
    AND [TransactionId] = '${transaction}';
`;

export const get_root_part = async (client: ConnectionPool, transaction: string): Promise<MSSQLRow[]> => {
  let res: IResult<any>;

  try {
    res = await client.query(sql(transaction));
  } catch (err) {
    throw new MSSQLError((err as Error).message, "Get Root Part");
  }

  if (res.recordset.length == 0) {
    throw new MSSQLError(`Could not find root part for transaction: ${transaction}`, "Get Root Part");
  }

  return res.recordset;
};
