import { BindingMultiParameterType } from "../providers/ifs/internal/Bindings";
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
            g_state_            VARCHAR2(100);  

            ${PLSQL.Part_Number__}
            ${PLSQL.Part_Revision__}
            ${PLSQL.Part_State__}

            ${PLSQL.Serial_Tracking__}

            ${PLSQL.Catalog__}
            ${PLSQL.Engineering__}
            ${PLSQL.Inventory__}
            ${PLSQL.Purchase__}
            ${PLSQL.Sales__}
            ${PLSQL.Technical__}

        BEGIN

            g_revision_ := Part_Revision__(Part_Number__(:c01), :c02);
            g_revision_used_ := g_revision_.new_revision_;
            g_state_    := Part_State__(Part_Number__(:c01), g_revision_used_);
            
            :revision   := g_revision_used_;
            :key        := :c01 || '_' || :c02;

            IF g_state_ = 'Obsolete' THEN
                RAISE_APPLICATION_ERROR(-20002, 'Part is Obsolete');
            END IF;

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

    public async part(parts: ExportPart[]) {
        const binds: BindingMultiParameterType = [];

        for (const part of parts) {
            const message = convert_to_part(part);
            const bind = get_bindings(message, get_bind_keys(this.plsql));
            binds.push({ ...bind, key: "", revision: "", error_message: "" })
        }
       
        const res: any = await this.tx.PlSql(this.plsql, binds);

        if (!res.ok) {
            throw new IFSError(res.errorText, "PartHandler", { message: "Request Error" });
        }

        const errors: Record<string, string> = {};

        for (const result of res.bindings) {
            if (result.error_message != null && result.error_message.trim().length != null) {
                errors[result.key] = result.error_message;
            }

            this.result_.set(result.key, result.revision)
        }

        if (Object.keys(errors).length != 0) {
            const formatted = Object.keys(errors).map((key) => { 
                const [part, rev] = key.split("_")
                return { part, rev, error: errors[key] }
            })

            throw new IFSError("Found Issues", "PartHandler", formatted)
        }

        return res.bindings.tracked;
    }
}