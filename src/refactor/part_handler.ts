import { Connection } from "../providers/ifs/internal/Connection";
import { IFSError, TimeoutError } from "../utils/error";
import { convert_to_part, ExportPart, get_bind_keys, get_bindings, sleep } from "../utils/tools";
import { PLSQL } from "./plsql";

const plsql = `
DECLARE

    -- Variables
    g_contract_             VARCHAR2(20) := 'SE';
    g_objstate_             VARCHAR2(100);
    g_error_message         VARCHAR2(20000);
    g_new_rev_              VARCHAR2(20);

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
    ${PLSQL.Check_Engineering_Part__}
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

    g_objstate_ := &AO.Eng_Part_Revision_API.Get_Obj_State(Get_Part_No__(:c01), g_new_rev_);

    :state      := g_objstate_;
    :rev        := g_new_rev_;
END;
`

export class PartHandler {
    private tx: Connection
    private active = true;
    private revisions: Record<string, string> = {}
    private obsolete: Record<string, string> = {}

    constructor(tx: Connection) {
        this.tx = tx;
    }

    public async exec(part: ExportPart) {
        if (!this.active) {
            return;
        }

        const message = convert_to_part(part);

        const bind = get_bindings(message, get_bind_keys(plsql));
        const cmd = this.tx.PlSql(plsql, { ...bind, state: "", rev: "", error: "" });
        const timeout = sleep(10000).then(() => null)

        const res = await Promise.race([cmd, timeout])

        if (res == null) {
            throw new TimeoutError(`Function Part Handler Exec took to long to complete!`, 10000)
        }

        if (!res.ok) {
            throw new IFSError(res.errorText, "Part Handler Exec", part);
        }

        if ((res.bindings as any).error != null && (res.bindings as any).error != "") {
            const func = (res.bindings as any).error.split(":")[0]
            const message = (res.bindings as any).error.replace(func + ":", "")
            throw new IFSError(message, func, part);
        }

        const { state, rev } = res.bindings as any

        this.revisions[part.partNumber + "_" + part.revision] = rev;

        if (state == "Obsolete") {
            this.obsolete[part.partNumber +  "_" + rev] = "Obsolete"
        }

        console.log(`Inserted Part (${part.partNumber}\t${part.revision})\twith result ${rev} ${state}`)
    }

    public getRevisionOf(partNumber: string | null, revision: string | null) {
        if (partNumber == null) {
            return "";
        }

        return this.revisions[partNumber + "_" + revision]
    }

    public checkObsolete() {
        if (Object.keys(this.obsolete).length != 0) {
            throw new IFSError("Found Obsolete parts in assembly", "Check Obsolete", this.obsolete)
        }
    }

    public stop() {
        this.active = false;
    }
}