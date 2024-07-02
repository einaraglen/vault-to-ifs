import { MSSQLRow } from "./providers/mssql/types";

export type InMessage = {
    c01?: string | null,
    c02?: string | null,
    c03?: string | null,
    c04?: string | null,
    c05?: string | null,
    c06?: string | null,
    c07?: string | null,
    c08?: string | null,
    c09?: string | null,
    c10?: string | null,
    c11?: string | null,
    c12?: string | null,
    c13?: string | null,
    c14?: string | null,
    c15?: string | null,
    c16?: string | null,
    c17?: string | null,
    c18?: string | null,
    c19?: string | null,
    c20?: string | null,
    c21?: string | null,
    c22?: string | null,
    c23?: string | null,
    c24?: string | null,
    c25?: string | null,
    c30?: string | null,
    c31?: string | null,
    c32?: string | null,
    n01?: string | null,
}

export const parse_boolean = (str: string | null): "0" | "1" => {
    return Number(str != null && str.toLowerCase() == "true").toString() as any
}

export const parse_spare_part = (str: string | null) : string => {
    const is_spare = str != null && str.length > 0;
    return is_spare ? "Y" : "N"
}

export const parse_part_mass = (str: string | null) => {
    return str ? str.replace(/,/g, ".") : ""
}

export const parse_supplier_part = (s_no: string | null, i_desc: string | null) => {
    if (!s_no && i_desc) {
        return i_desc
    }

    if (!s_no || i_desc) {
        return "";
    }

    const equal_removed = s_no.replace(/=/g, "-");

    return equal_removed.replace(/%/g, "p");
}

export const fix_part_units = (qty: string | null, units: string | null) => {
    if (qty != null && qty.endsWith("m")) {
        return "m"
    }

    return units || "Each";
}

export const fix_part_qty = (qty: string | null) => {
    const qty_ = qty ? qty.replace("m", "").trim() : "0"
    return qty_.replace(/,/g, ".")
}

export const get_bind_keys = (plsql: string) => {
    const regex = /:[a-zA-Z]\d{2}/g;
    const matches = plsql.match(regex);
    const unique = matches ? Array.from(new Set(matches)) : [];
    return unique.map((bind) => bind.replace(":", ""))
}

export const get_bindings = (message: InMessage, keys: string[]) => {
    let tmp: any = {}

    for (const key of keys) {
        tmp[key] = (message as Record<string, any>)[key]
    }

    return tmp;
}

export const convert_to_part = (row: MSSQLRow): InMessage => {
    return {
        c01: row.ItemNumber,
        c02: row.Revision,
        c03: fix_part_units(row.Quantity, row.Units),
        c04: "",
        c05: "", // LastModBy
        c06: "",
        c07: row.Title,
        c08: row.Description,
        c09: row.InternalDescription,
        c10: row.MaterialCertifikate,
        c11: row.Category_1,
        c12: row.Category_2,
        c13: row.Category_3,
        c14: row.Category_4,
        c15: parse_spare_part(row.SparePart),
        c16: row.Vendor,
        c17: row.SerialNo,
        c18: row.LifecycleState,
        c19: "", // Revision
        c20: parse_boolean(row.CriticalItem),
        c21: parse_boolean(row.LongLeadItem),
        c22: parse_supplier_part(row.SupplierPartNo, row.InternalDescription),
        c23: row.Material,
        c24: "", // Project
        c25: parse_part_mass(row.Mass_g),
        c30: "", // TransactionId
        c31: row.ReleasedBy,
        c32: row.ReleaseDate,
    }
}

export const convert_to_struct = (row: MSSQLRow): InMessage => {
    return {
        c02: row.ParentItemNumber,
        c03: row.ParentItemRevision,
        c04: row.Pos,
        c06: row.ItemNumber,
        c07: row.Revision,
        c09: parse_spare_part(row.SparePart),
        n01: fix_part_qty(row.Quantity),
    }
}

export const filter_unique_parts = (rows: MSSQLRow[]) => {
    const parts_map: Record<string, InMessage> = {}

    for (const row of rows) {
        parts_map[`${row.ItemNumber}.${row.Revision}`] = convert_to_part(row)
    }

    const list = Object.entries(parts_map).map((e) => e[1]);
    return { map: parts_map, list }
}

export type StructureChain = Record<string, InMessage[]>

export const build_structure_chain = (rows: MSSQLRow[], map: Record<string, InMessage>) => {
    const chain: StructureChain = {}

    for (const row of rows) {
        const parent_key = `${row.ParentItemNumber}.${row.ParentItemRevision}`
        const parent = map[parent_key]

        if (!parent) {
            throw Error(`Cannot find parent entry for: ${parent_key}`)
        }
    
        const key = `${parent.c01}.${parent.c02}.${parent.c18}`
        chain[key] = [convert_to_struct(row), ...(chain[key] || [])]
    }

    return chain
}

export const sleep = (timeout: number): Promise<void> => {
    return new Promise((r) => setTimeout(r, timeout));
}