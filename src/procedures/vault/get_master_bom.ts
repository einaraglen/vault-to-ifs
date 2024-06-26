import { ConnectionPool } from "mssql";
import { MSSQLRow } from "../../providers/mssql/types";

export const get_master_bom = async (client: ConnectionPool): Promise<MSSQLRow[]> => {
        const res = await client.query`
                SELECT DISTINCT 
                        BOM.[ItemNumber] "part_no",
                        BOM.[Revision] "revision",
                        BOM.[Category] "category",
                        BOM.[Title] "title",
                        BOM.[Description] "description",
                        BOM.[Units] "units",
                        BOM.[LifecycleState] "state",
                        BOM.[Category_1] "cat_1",
                        BOM.[Category_2] "cat_2",
                        BOM.[Category_3] "cat_3",
                        BOM.[Category_4] "cat_4",
                        BOM.[InternalDescription] "internal_description",
                        BOM.[Mass_g] "mass",
                        BOM.[Material] "material",
                        BOM.[MaterialCertifikate] "certificate",
                        BOM.[Project] "project",
                        BOM.[SerialNo] "serial_no",
                        BOM.[SparePart] "spare_part",
                        BOM.[Vendor] "vendor",
                        BOM.[CriticalItem] "critical_item",
                        BOM.[LongLeadItem] "long_lead_item",
                        BOM.[SupplierPartNo] "supplier_part_no",
                        ISNULL(BOM.[LifecycleState], BOM.[State(Historical)]) "status",
                        BOM.[State(Historical)] "status_historical",
                        BOM.[TransactionId] "transaction_id",
                        BOM.[LastUpdatedBy] "last_updated_by",
                        CONVERT(datetime, LEFT(BOM.[LastUpdate], 19), 120) "last_update",
                        BOM.[ReleasedBy] "created_by",
                        CONVERT(datetime, LEFT(BOM.[ReleaseDate], 19), 120)  "created_date"
                FROM [ERP].[dbo].[BOM] BOM
                WHERE BOM.[Status] = 'Posted' AND BOM.[ItemNumber] != ''
        `;
    
        return res.recordset
    }