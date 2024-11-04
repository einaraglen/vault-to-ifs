import { Connection } from "../../providers/ifs/internal/Connection";
import { IFSError } from "../../utils/error";
import { ExportPart } from "../../utils/tools";
import { check_part_state } from "../parts/check_part_state";

export const check_sub_structure = async (tx: Connection, parts: ExportPart[], new_revisions: Record<string, string>) => {
    const obsolete: Record<string, { revision: string, state: string }> = {}

    for (const part of parts) {
        let revision = part.revision;

        if (new_revisions[part.partNumber]) {
            revision = new_revisions[part.partNumber]
        }

        const check = await check_part_state(tx, { partNumber: part.partNumber, revision } as any);
        const { state } = check.bindings as any;

        if (state == "Obsolete") {
            obsolete[part.partNumber] = { revision, state }
        }
    }

    if (Object.keys(obsolete).length != 0) {
        throw new IFSError("Found one or more obsolete in assembly", "Check Part State", obsolete);
    }
}