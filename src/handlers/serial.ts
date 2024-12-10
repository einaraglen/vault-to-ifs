import { Connection } from "../providers/ifs/internal/Connection";
import { IFSError } from "../utils/error";
import { PLSQL } from "../utils/plsql";
import { convert_to_part, ExportPart, get_bind_keys, get_bindings } from "../utils/tools";


export class SerialHandler {
    private tx: Connection

    private plsql = `
        DECLARE

            ${PLSQL.Part_Number__}
            ${PLSQL.Serial_Tracking__}

        BEGIN
        
            Serial_Tracking__(Part_Number__(:c01), :c02);

            EXCEPTION
                WHEN OTHERS THEN
                    :error_message := SQLERRM;

        END;
    `

    constructor(tx: Connection) {
        this.tx = tx;
    }

    public async part(part: ExportPart) {
        const message = convert_to_part(part);

        const bind = get_bindings(message, get_bind_keys(this.plsql));
        const res: any = await this.tx.PlSql(this.plsql, { ...bind, error_message: "" });

        if (!res.ok) {
            const regex = /line (\d+), column (\d+)/;
            const match = regex.exec(res.errorText);

            if (match) {
                const line = Number(match[1])
                const column = Number(match[2])
                const issue = this.plsql.split("\n").slice(line - 1, line)[0].trim()
                const tmp = Array(issue.length).fill(" ");
                tmp[column - 2] = "^"

                console.log("\n## ISSUE LINE START ##\n")
                console.log(issue)
                console.log(tmp.join(""))
                console.log("## ISSUE LINE END ##\n")
            }

            throw new IFSError(res.errorText, "Set Part Serial", part);
        }

        if (res.bindings.error_message != null && res.bindings.error_message.trim().length != null) {
            throw new IFSError(res.bindings.error_message, "Set Part Serial", part);
        }

        return res;
    }
}