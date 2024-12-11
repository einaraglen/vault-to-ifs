import { BindingMultiParameterType } from "../providers/ifs/internal/Bindings";
import { Connection } from "../providers/ifs/internal/Connection";
import { IFSError } from "../utils/error";
import { PLSQL } from "../utils/plsql";
import { convert_to_part, ExportPart, get_bind_keys, get_bindings } from "../utils/tools";

export class StateHandler {
    private tx: Connection

    private plsql = `
        DECLARE

            count_ NUMBER;

            ${PLSQL.Part_Number__}
            ${PLSQL.Part_Children__}
            ${PLSQL.State__}

        BEGIN
        
            :key := :c01 || '_' || :c02;

            count_ := Part_Children__(Part_Number__(:c01), :c02);

            IF count_ != TO_NUMBER(:c33) THEN
                RAISE_APPLICATION_ERROR(-20002, 'Child count does not match: IFS=' || count_ || ', VAULT=' || :c33);
            END IF;

            State__();

            EXCEPTION
                WHEN OTHERS THEN
                    :error_message := SQLERRM;

        END;
    `

    constructor(tx: Connection) {
        this.tx = tx;
    }

    public async part(parts: ExportPart[]) {
        const binds: BindingMultiParameterType = [];

        for (const part of parts) {
            const message = convert_to_part(part);
            const bind = get_bindings(message, get_bind_keys(this.plsql));
            binds.push({ ...bind, key: "", error_message: "" })
        }
       
        const res: any = await this.tx.PlSql(this.plsql, binds);

        if (!res.ok) {
            throw new IFSError(res.errorText, "StateHandler", { message: "Request Error" });
        }

        const errors: Record<string, string> = {};

        for (const result of res.bindings) {
            if (result.error_message != null && result.error_message.trim().length != null) {
                errors[result.key] = result.error_message;
            }
        }

        if (Object.keys(errors).length != 0) {
            const formatted = Object.keys(errors).map((key) => { 
                const [part, rev] = key.split("_")
                return { part, rev, error: errors[key] }
            })

            throw new IFSError("Found Issues", "StateHandler", formatted)
        }

        return res;
    }
}