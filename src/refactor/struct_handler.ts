import { Connection } from "../providers/ifs/internal/Connection";
import { PlSqlMultiResponse, PlSqlOneResponse } from "../providers/ifs/internal/PlSqlCommandTypes";
import { IFSError } from "../utils/error";
import { convert_to_struct, ExportPart, get_bind_keys, get_bindings } from "../utils/tools";

const plsql = `
`

export class StructHandler {
    private tx: Connection
    private active = true;

    constructor(tx: Connection) {
        this.tx = tx;
    }

    public async exec(part: ExportPart) {
        if (!this.active) {
            return;
        }
        
        const message = convert_to_struct(part)

        let bind: any = null;
        let res: PlSqlOneResponse | PlSqlMultiResponse | null = null;

        try {
            bind = get_bindings(message, get_bind_keys(plsql));
            res = await this.tx.PlSql(plsql, { ...bind, temp: "" });
        } catch (err) {
            throw new IFSError((err as Error).message, "Create Revision Structure", part)
        }

        if (!res.ok) {
            throw new IFSError(res.errorText, "Create Revision Structure", part);
        }

        return res;
    }

    public stop() {
        this.active = false;
    }
}