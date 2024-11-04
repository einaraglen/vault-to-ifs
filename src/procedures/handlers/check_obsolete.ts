import { Connection } from "../../providers/ifs/internal/Connection";
import { IFSError } from "../../utils/error";
import { ExportPart } from "../../utils/tools";
import { check_part_state } from "../parts/check_part_state";

export const check_obsolete = async (tx: Connection, parts: ExportPart[], revisions: Record<string, string>) => {
    const bad_apples: Record<string, { revision: string, state: string }> = {}

    for (const part of parts) {
        let revision = part.revision;

        if (revisions[part.partNumber + "_" + part.revision]) {
            revision = revisions[part.partNumber + "_" + part.revision]
        }

        const check = await check_part_state(tx, { partNumber: part.partNumber, revision } as any);
        const { state } = check.bindings as any;

        if (state == "Obsolete") {
            bad_apples[part.partNumber] = { revision, state }
        }
    }

    if (Object.keys(bad_apples).length != 0) {
        throw new IFSError("Assembly contains obsolete parts", "Check Part State", bad_apples);
    }
}