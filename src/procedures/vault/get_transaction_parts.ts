import { ConnectionPool } from "mssql";
import { MSSQLRow } from "../../providers/mssql/types";

const sql = (root: string, transaction: string) => `
SELECT [ItemNumber]
      ,[Revision]
      ,[Quantity]
      ,[Pos]
      ,[ParentItemNumber]
      ,[ParentItemRevision]
      ,[ChildCount]
      ,[Category]
      ,[Title]
      ,[Description]
      ,[Units]
      ,[LifecycleState]
      ,[Category_1]
      ,[Category_2]
      ,[Category_3]
      ,[Category_4]
      ,[InternalDescription]
      ,[Mass_g]
      ,[Material]
      ,[MaterialCertifikate]
      ,[Project]
      ,[SerialNo]
      ,[SparePart]
      ,[Vendor]
      ,[CriticalItem]
      ,[LongLeadItem]
      ,[SupplierPartNo]
      ,[ReleaseDate]
      ,[LastUpdate]
      ,[Status]
      ,[ErrorDescription]
      ,[ReleasedBy]
      ,[LastUpdatedBy]
      ,[State(Historical)]
      ,[TransactionId]
      ,[InventorQuantity]
      ,[NewRevision]
      ,[NewParentItemRevision]
FROM [ERP].[dbo].[BOM]
WHERE [TransactionId] = '${transaction}'
AND [ItemNumber] != '${root}';
`;

export const get_transaction_parts = async (client: ConnectionPool, root: string, transaction: string): Promise<MSSQLRow[]> => {
    const res = await client.query(sql(root, transaction));

    return res.recordset
}