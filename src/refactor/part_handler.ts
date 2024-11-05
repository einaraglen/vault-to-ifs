import { Connection } from "../providers/ifs/internal/Connection";
import { PlSqlMultiResponse, PlSqlOneResponse } from "../providers/ifs/internal/PlSqlCommandTypes";
import { IFSError } from "../utils/error";
import { convert_to_part, ExportPart, get_bind_keys, get_bindings } from "../utils/tools";
import { PLSQL } from "./plsql";

const plsql = `
DECLARE

    -- Variables
    objstate_             VARCHAR2(100);
    contract_             VARCHAR2(20) := 'SE';
    g_error_message       VARCHAR2(20000);

    -- Helpers
    ${PLSQL.Types__}
    ${PLSQL.Get_Part_No__}
    ${PLSQL.Get_New_Revision__}
    ${PLSQL.Check_Editable__}
    ${PLSQL.Check_Error__}

    -- Getters
    ${PLSQL.Get_Catalog_Part__}
    ${PLSQL.Get_Engineering_Part__}
    ${PLSQL.Get_Engineering_Latest__}
    ${PLSQL.Get_Inventory_Part__}
    ${PLSQL.Get_Purchase_Part__}
    ${PLSQL.Get_Sales_Part__}

    -- Mutators
    ${PLSQL.Create_Catalog_Part__}
    ${PLSQL.Add_Spesification__}
    ${PLSQL.Add_Manufacturer__}
    ${PLSQL.Create_Engineering_Part__}
    ${PLSQL.Create_Inventory_Part__}
    ${PLSQL.Set_Weight_Net__}
    ${PLSQL.Create_Purchase_Part__}
    ${PLSQL.Create_Sales_Part__}

BEGIN
    Create_Catalog_Part__();
    IF Check_Error__() THEN
        RETURN;
    END IF;

    Add_Spesification__();
    IF Check_Error__() THEN
        RETURN;
    END IF;

    Add_Manufacturer__();
    IF Check_Error__() THEN
        RETURN;
    END IF;

    Create_Engineering_Part__();
    IF Check_Error__() THEN
        RETURN;
    END IF;

    Create_Inventory_Part__();
    IF Check_Error__() THEN
        RETURN;
    END IF;

    Set_Weight_Net__();
    IF Check_Error__() THEN
        RETURN;
    END IF;

    Create_Purchase_Part__();
    IF Check_Error__() THEN
        RETURN;
    END IF;

    Create_Sales_Part__();
    IF Check_Error__() THEN
        RETURN;
    END IF;

    objstate_ := &AO.Eng_Part_Revision_API.Get_Obj_State(Get_Part_No__(:c01), :c02);
    :temp := objstate_;
END;
`

export class PartHandler {
    private tx: Connection
    private active = true;

    constructor(tx: Connection) {
        this.tx = tx;
    }

    public async exec(part: ExportPart) {
        if (!this.active) {
            return;
        }

        console.log("Inserting", part.partNumber)

        const message = convert_to_part(part);

        const bind = get_bindings(message, get_bind_keys(plsql));
        const res = await this.tx.PlSql(plsql, { ...bind, temp: "", error: "" });

        if (!res.ok) {
            throw new IFSError(res.errorText, "Part Handler Exec", part);
        }

        if ((res.bindings as any).error != null && (res.bindings as any).error != "") {
            const func = (res.bindings as any).error.split(":")[0]
            const message = (res.bindings as any).error.replace(func + ":", "")
            throw new IFSError(`[${func}]: ` + message, func, part);
        }

        return res;
    }

    public stop() {
        this.active = false;
    }
}