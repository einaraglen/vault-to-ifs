import { ConnectionPool } from "mssql";
import { MSSQLRow } from "../../providers/mssql/types";

const sql = (limit: number) => `
SELECT TOP (${limit}) [ItemNumber]
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