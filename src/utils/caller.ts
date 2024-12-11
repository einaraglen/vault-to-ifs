import { Connection } from "../providers/ifs/internal/Connection"
import { ExportPart, get_bind_keys, get_bindings, InMessage } from "./tools";

export abstract class Caller {
    public tx: Connection
    private plsql: string = "";

    constructor(tx: Connection) {
        this.tx = tx;
    }
}