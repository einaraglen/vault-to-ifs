import { Connection } from "../providers/ifs/internal/Connection";
import { convert_to_part, ExportPart, get_bind_keys, get_bindings } from "../utils/tools";

class MessageHandler {
    private tx: Connection

    private plsql = `
        DECLARE
        BEGIN
        
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
            this.parseORIssue(res.errorText)
            throw new Error(res.errorText);
        }

        if (res.bindings.error_message != null && res.bindings.error_message.trim().length != null) {
            throw new Error(res.bindings.error_message);
        }

        return res;
    }

    private parseORIssue(str: string) {
        const regex = /line (\d+), column (\d+)/;
        const match = regex.exec(str);

        if (match) {
            const line = Number(match[1])
            const column = Number(match[2])
            const issue = this.plsql.split("\n").slice(line - 1, line)[0].trim()
            const tmp = Array(issue.length).fill(" ");
            tmp[column - 2] = "^"

            console.log("## ISSUE LINE START ##\n")
            console.log(issue)
            console.log(tmp.join(""))
            console.log("## ISSUE LINE END ##")
        }

    }
}