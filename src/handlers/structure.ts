import { BindingMultiParameterType } from "../providers/ifs/internal/Bindings";
import { Connection } from "../providers/ifs/internal/Connection";
import { IFSError } from "../utils/error";
import { PLSQL } from "../utils/plsql";
import { convert_to_struct, ExportPart, get_bind_keys, get_bindings } from "../utils/tools";

export class StructureHandler {
    private tx: Connection

    private plsql = `
        DECLARE

            ${PLSQL.Part_Number__}
            ${PLSQL.Structure__}

        BEGIN
        
            :key := :c06 || '_' || :c07;

            Structure__();

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
            const message = convert_to_struct(part);
            const bind = get_bindings(message, get_bind_keys(this.plsql));
            binds.push({ ...bind, key: "", error_message: "" })
        }
       
        const res: any = await this.tx.PlSql(this.plsql, binds);

        if (!res.ok) {
            throw new IFSError(res.errorText, "StructureHandler", { message: "Request Error" });
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

            throw new IFSError("Found Issues", "StructureHandler", formatted)
        }

        return res;
    }
}