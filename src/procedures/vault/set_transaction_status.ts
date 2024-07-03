import { ConnectionPool, IResult } from "mssql";
import { MSSQLRow } from "@providers/mssql/types";
import { MSSQLError } from "@utils/error";

const sql = (status: "AcceptedBOM" | "Error", transaction: string) => `
    UPDATE [ERP].[dbo].[BOM]
    SET [Status] = '${status}'
    WHERE [TransactionId] = '${transaction}';
`;

export const set_transaction_status = async (client: ConnectionPool, status: "AcceptedBOM" | "Error", transaction: string): Promise<MSSQLRow[]> => {
  let res: IResult<any>;

  try {
    res = await client.query(sql(status, transaction));
  } catch (err) {
    throw new MSSQLError((err as Error).message, "Get Root Part");
  }

  return res.recordset;
};
