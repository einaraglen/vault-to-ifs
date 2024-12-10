import { Connection } from "../providers/ifs/internal/Connection";
import { IFSError } from "../utils/error";
import { PLSQL } from "../utils/plsql";
import { convert_to_part, ExportPart, get_bind_keys, get_bindings } from "../utils/tools";


export class PartHandler {
    private tx: Connection
    private result_: Map<string, string | null> = new Map();

    private plsql = `
        DECLARE

            TYPE REV_REV IS RECORD (
                new_revision_       VARCHAR2(20),
                current_part_rev_   VARCHAR2(20),
                new_rev_            VARCHAR2(20)
            );

            g_revision_         REV_REV;
            g_revision_used_    VARCHAR2(20);
            g_tracked_          VARCHAR2(100);  
            g_state_            VARCHAR2(100);  

            ${PLSQL.Part_Number__}
            ${PLSQL.Part_Revision__}
            ${PLSQL.Part_State__}
            ${PLSQL.Part_Tracked__}

            ${PLSQL.Catalog__}
            ${PLSQL.Engineering__}
            ${PLSQL.Inventory__}
            ${PLSQL.Purchase__}
            ${PLSQL.Sales__}
            ${PLSQL.Technical__}

            ${PLSQL.Serial_Tracking__}

        BEGIN

            g_revision_ := Part_Revision__(Part_Number__(:c01), :c02);

            g_revision_used_ := g_revision_.new_revision_;

            g_state_    := Part_State__(Part_Number__(:c01), g_revision_used_);
            g_tracked_  := Part_Tracked__(Part_Number__(:c01));
            
            :revision   := g_revision_used_;
            :state      := g_state_;
            :tracked    := g_tracked_;

            IF SUBSTR(Part_Number__(:c01), 1, 1) != '1' THEN
                Serial_Tracking__(Part_Number__(:c01));
            END IF;

            Catalog__();

            Engineering__();

            Inventory__();
            Purchase__();
            Sales__();
            Technical__();


            EXCEPTION
                WHEN OTHERS THEN
                    :error_message := SQLERRM;

        END;
    `

    constructor(tx: Connection) {
        this.tx = tx;
    }

    public get result() {
        return this.result_;
    }

    public async part(part: ExportPart) {
        const message = convert_to_part(part);

        const bind = get_bindings(message, get_bind_keys(this.plsql));
        const res: any = await this.tx.PlSql(this.plsql, { ...bind, revision: "", state: "", tracked: "", error_message: "" });

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

            throw new IFSError(res.errorText, "Insert Unique Part", part);
        }

        if (res.bindings.tracked == "SERIAL TRACKING") {
            console.log(part.partNumber, part.revision, { tracked: res.bindings.tracked })
        }

        if (res.bindings.error_message != null && res.bindings.error_message.trim().length != null) {
            throw new IFSError(res.bindings.error_message, "Insert Unique Part", part);
        }

        const key = `${part.partNumber}_${part.revision}`
        const data = res.bindings.revision
        this.result_.set(key, data)

        return res.bindings.tracked;
    }
}