import { Connection } from "../providers/ifs/internal/Connection";
import { IFSError, TimeoutError } from "../utils/error";
import { convert_to_part, convert_to_struct, ExportPart, get_bind_keys, get_bindings, InMessage, sleep } from "../utils/tools";
import { PartHandler } from "./part_handler";
import { PLSQL } from "../utils/plsql";

const child_plsql = `
DECLARE
    -- Helpers
    ${PLSQL.Get_Part_No__}
    
    -- Mutators
    ${PLSQL.Add_Struct_Part__}
BEGIN
    Add_Struct_Part__();

    :state := 'complete';
    :count := 0;
END;
`

const state_plsql = `
DECLARE
    -- Variables
    g_count_    NUMBER;

    -- Helpers
    ${PLSQL.Get_Part_No__}

    -- Mutators
    ${PLSQL.Set_Struct_State__}
    ${PLSQL.Check_Child_Count__}
BEGIN
    Set_Struct_State__();
    g_count_    := Check_Child_Count__(Get_Part_No__(:c01), :c02);

    :state      := 'complete';
    :count      := g_count_;
END;
`

export class StructHandler {
    private tx: Connection
    private active = true;
    private partHandler: PartHandler
    private count: Record<string, number> = {}

    constructor(tx: Connection, partHandler: PartHandler) {
        this.partHandler = partHandler;
        this.tx = tx;
    }

    public async exec_child(part: ExportPart) {
        const child_rev = this.partHandler.getRevisionOf(part.partNumber, part.revision)
        const parent_rev = this.partHandler.getRevisionOf(part.parentPartNumber, part.parentRevision)

        const message = convert_to_struct({ ...part, revision: child_rev, parentRevision: parent_rev })
        this.exec(part, message, child_plsql, "Add_Struct_Part__")

        console.log(`Inserted Struct (${part.partNumber}\t${child_rev})`)
    }

    public async exec_state(part: ExportPart) {
        const child_rev = this.partHandler.getRevisionOf(part.partNumber, part.revision)
        const message = convert_to_part({ ...part, revision: child_rev })
        const res = await this.exec(part, message, state_plsql, "Set_Struct_State__")

        const { count } = res?.bindings as any

        this.count[part.id] = count;

        console.log(`Checked (${part.partNumber}\t${child_rev})\twith result ${count}`)
    }

    private async exec(part: ExportPart, message: InMessage, plsql: string, func: string) {
        if (!this.active) {
            return;
        }

        const bind = get_bindings(message, get_bind_keys(plsql));
        const cmd = this.tx.PlSql(plsql, { ...bind, state: "", count: 0 });
        const timeout = sleep(10000).then(() => null)

        const res = await Promise.race([cmd, timeout])

        if (res == null) {
            throw new TimeoutError(`Function ${func} took to long to complete!`, 10000)
        }

        if (!res.ok) {
            throw new IFSError(res.errorText, func, part);
        }

        return res;
    }

    public checkChildCount(parts: ExportPart[]) {
        const count_lookup: Record<string, ExportPart[]> = {}
        const part_lookup: Record<string, ExportPart> = {}

        for (const part of parts) {
            part_lookup[part.id] = part;
            if (part.parentId != null) {
                const prev = count_lookup[part.parentId] ?? []
                count_lookup[part.parentId] = [...prev, part]
            }
        }

        const bad_apples: Record<string, { vault: number, ifs: number }> = {}

        for (const [id, count] of Object.entries(this.count)) {
            const vault = count_lookup[id] ? count_lookup[id].length : 0;
            const ifs = count;

            if (vault != ifs) {
                const part = part_lookup[id]
                const rev = this.partHandler.getRevisionOf(part.partNumber, part.revision)
                bad_apples[part.partNumber + "_" + rev] = { vault, ifs }
            }
        }

        if (Object.keys(bad_apples).length > 0) {
            throw new IFSError("IFS Structure does not match Vault Data", "Check Child Count", bad_apples)
        }

    }

    public stop() {
        this.active = false;
    }
}