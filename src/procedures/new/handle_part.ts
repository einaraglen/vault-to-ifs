import { Connection } from "../../providers/ifs/internal/Connection";
import { PlSqlMultiResponse, PlSqlOneResponse } from "../../providers/ifs/internal/PlSqlCommandTypes";
import { IFSError } from "../../utils/error";
import { convert_to_part, ExportPart, get_bind_keys, get_bindings } from "../../utils/tools";
import { Create_Inventory_Part } from "./methods/create_inventory_part";
import { Create_Master_Part } from "./methods/create_master_part";
import { Create_Sales_Part } from "./methods/create_sales_part";
import { Create_Technical_Part } from "./methods/create_technical_part";
import { Get_Part_No } from "./methods/get_part_no";
import { Get_Revision } from "./methods/get_revision";
import { Set_Mat_Cert } from "./methods/set_mat_cert";
import { Set_Net_Weight } from "./methods/set_net_weight";
import { Set_Part_Supplier } from "./methods/set_part_supplier";

const plsql = `
    DECLARE
        part_rev_      VARCHAR2(50);

        ${Get_Revision}
        ${Get_Part_No}

        ${Set_Net_Weight}
        ${Set_Mat_Cert}
        ${Set_Part_Supplier}

        ${Create_Master_Part}
        ${Create_Inventory_Part}
        ${Create_Sales_Part}
        ${Create_Technical_Part}
    BEGIN
        part_rev_ := Create_Master_Part();

        Create_Inventory_Part();
        Create_Sales_Part();
        Create_Technical_Part();

        Set_Part_Supplier();

        :temp := part_rev_;
    END;
`;

export const handle_part = async (client: Connection, row: ExportPart) => {
    const message = convert_to_part(row);

    let bind: any = null;
    let res: PlSqlOneResponse | PlSqlMultiResponse | null = null;
  
    try {
      bind = get_bindings(message, get_bind_keys(plsql));
      res = await client.PlSql(plsql, { ...bind, temp: "" });
    } catch (err) {
      throw new IFSError((err as Error).message, "Handle Part", row)
    }
  
    if (!res.ok) {
      throw new IFSError(res.errorText, "Handle Part", row);
    }

    console.log(res.bindings)
  
    return res;
  };
  