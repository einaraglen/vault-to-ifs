import { MSSQLError } from "./error";

export type InMessage = {
  c01?: string | null;
  c02?: string | null;
  c03?: string | null;
  c04?: string | null;
  c05?: string | null;
  c06?: string | null;
  c07?: string | null;
  c08?: string | null;
  c09?: string | null;
  c10?: string | null;
  c11?: string | null;
  c12?: string | null;
  c13?: string | null;
  c14?: string | null;
  c15?: string | null;
  c16?: string | null;
  c17?: string | null;
  c18?: string | null;
  c19?: string | null;
  c20?: string | null;
  c21?: string | null;
  c22?: string | null;
  c23?: string | null;
  c24?: string | null;
  c25?: string | null;
  c30?: string | null;
  c31?: string | null;
  c32?: string | null;
  c33?: string | null;
  n01?: string | null;
};

export type Cursor = { part: null | string; struct: null | string };

export const parse_boolean = (str: string | null): "0" | "1" => {
  return Number(str != null && str.toLowerCase() == "true").toString() as any;
};

export const parse_spare_part = (str: string | null): string => {
  const is_spare = str != null && str.length > 0;
  return is_spare ? "Y" : "N";
};

export const parse_part_mass = (str: string | null) => {
  return str ? str.replace(/,/g, ".") : "";
};

export const parse_supplier_part = (s_no: string | null, i_desc: string | null) => {
  if (!s_no && i_desc) {
    return i_desc;
  }

  if (!s_no || i_desc) {
    return "";
  }

  const equal_removed = s_no.replace(/=/g, "-");

  return equal_removed.replace(/%/g, "p");
};

export const fix_part_units = (qty: string | null, units: string | null) => {
  if (qty != null && qty.endsWith("mm")) {
    return "mm";
  }

  if (qty != null && qty.endsWith("m")) {
    return "m";
  }

  if (units == null) {
    return "PCS"
  }

  if (units && units == "Each" || units.toLowerCase() == "stk") {
    return "PCS"
  }

  return units || "PCS";
};

export const fix_part_qty = (qty: string | null) => {
  const qty_ = qty ? qty.replace(/m/g, "").trim() : "0";
  return qty_.replace(/,/g, ".");
};

export const get_bind_keys = (plsql: string) => {
  const regex = /:[a-zA-Z]\d{2}/g;
  const matches = plsql.match(regex);
  const unique = matches ? Array.from(new Set(matches)) : [];
  return unique.map((bind) => bind.replace(":", ""));
};

export const get_bindings = (message: InMessage, keys: string[]) => {
  let tmp: any = {};

  for (const key of keys) {
    tmp[key] = (message as Record<string, any>)[key];
  }

  return tmp;
};

export const convert_to_part = (row: ExportPart): InMessage => {
  return {
    c01: row.partNumber,
    c02: row.revision,
    c03: fix_part_units(row.quantity, row.units),
    c04: "",
    c05: "", // LastModBy
    c06: "",
    c07: row.title,
    c08: row.description,
    c09: row.supplierDescription,
    c10: row.materialCertificate,
    // c11: "not-in-use",
    // c12: "not-in-use",
    // c13: "not-in-use",
    // c14: "not-in-use",
    c15: parse_spare_part(row.isSpare),
    c16: row.supplier,
    c17: row.serialNumber,
    c18: row.state,
    c19: "", // Revision
    c20: parse_boolean(row.isCritical),
    c21: parse_boolean(row.isLongLead),
    c22: row.supplierPartNumber,
    c23: row.material,
    c24: "", // Project
    c25: parse_part_mass(row.mass),
    c30: "", // TransactionId
    c31: "ReleasedBy",
    c32: row.released,
    c33: row.childCount,
  };
};

export const convert_to_struct = (row: ExportPart): InMessage => {
  return {
    c02: row.parentPartNumber,
    c03: row.parentRevision,
    c04: row.position,
    c06: row.partNumber,
    c07: row.revision,
    c09: parse_spare_part(row.isSpare),
    n01: fix_part_qty(row.quantity),
  };
};

export const filter_unique_parts = (rows: ExportPart[]) => {
  const parts_map: Record<string, ExportPart> = {};
  const lookup: Record<string, ExportPart> = {}

  const root = rows.find((p) => p.parentPartNumber == "")

  if (root == null) {
    throw new Error(`Failed to find root part`)
  }

  for (const row of rows) {
    lookup[row.id] = row;
    parts_map[`${row.partNumber}.${row.revision}`] = row;
  }

  const list = Object.entries(parts_map).map((e) => e[1]);
  return { map: lookup, list, root };
};

export type StructureChain = Record<string, ExportPart[]>;

export type Structure = { parent: ExportPart, children: ExportPart[] }

export const build_structure_chain = (rows: ExportPart[], map: Record<string, ExportPart>) => {
  const chain: StructureChain = {};

  for (const row of rows) {
    if (row.parentId) {
      const parent = map[row.parentId];

      if (!parent) {
        throw new MSSQLError(`Cannot find parent entry for: ${row.partNumber}-${row.revision}`, "Build Structure Chain");
      }

      chain[parent.id] = [row, ...(chain[parent.id] || [])];
    }
  }

  const struct: Structure[] = []

  for (const key in chain) {
    const parent = map[key]
    struct.push({ parent, children: chain[key] })
  }

  return struct;
};

export const sleep = (timeout: number = 100): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

export type ExportPart = {
  id: string
  parentId: string
  partNumber: string,
  revision: string,
  title: string,
  units: string,
  author: string,
  state: string,
  description: string | null,
  category: string | null,
  mass: string | null,
  material: string | null,
  materialCertificate: string | null,
  serialNumber: string | null,
  childCount: string | null,
  supplier: string | null,
  supplierPartNumber: string | null,
  supplierDescription: string | null,
  isSpare: string | null,
  isCritical: string | null,
  isLongLead: string | null,
  quantity: string | null,
  position: string | null,
  parentPartNumber: string | null,
  parentRevision: string | null,
  released: string
}

export const parse_oracle_error = (err: string, plsql: string) => {
  const regex = /line (\d+), column (\d+)/;
  const match = regex.exec(err);

  if (match) {
      const line = Number(match[1])
      const column = Number(match[2])
      const issue = plsql.split("\n").slice(line - 1, line)[0].trim()
      const tmp = Array(issue.length).fill(" ");
      tmp[column - 2] = "^"

      console.log("## ISSUE LINE START ##")
      console.log(issue.replace("\n", ""))
      console.log(tmp.join(""))
      console.log("## ISSUE LINE END ##")
  }
}