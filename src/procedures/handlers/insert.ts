import { Connection } from "../../providers/ifs/internal/Connection";
import { CheckError, IFSError } from "../../utils/error";
import { ExportPart, Structure } from "../../utils/tools";
import { change_structure_state } from "../bom/change_structure_state";
import { check_structure_size } from "../bom/check_structure_size";
import { create_rev_structure } from "../bom/create_rev_structure";
import { add_manufacturer } from "../parts/add_manufacturer";
import { add_technical_spesification } from "../parts/add_technical_spesification";
import { check_child_count } from "../parts/check_child_count";
import { create_catalog_part } from "../parts/create_catalog_part";
import { create_engineering_part } from "../parts/create_engineering_part";
import { create_inventory_part } from "../parts/create_inventory_part";
import { create_purchase_part } from "../parts/create_purchase_part";
import { create_sales_part } from "../parts/create_sales_part";

export const insert_unique_parts = async (tx: Connection, parts: ExportPart[]) => {
  const new_revisions: Record<string, string> = {};

  for (const part of parts) {
    try {
      const cat = await create_catalog_part(tx, part);
      const { unit } = cat.bindings as any;

      if (unit && part.units && unit != part.units) {
        part.units = unit;
      }

      await add_technical_spesification(tx, part);
      await add_manufacturer(tx, part);

      const eng = await create_engineering_part(tx, part);
      const { part_rev } = eng.bindings as any;

      if (part_rev && part.revision && part_rev != part.revision) {
        console.log("New Rev for", part.partNumber, part_rev)
        new_revisions[part.partNumber + "_" + part.revision] = part_rev;
      }

      await create_inventory_part(tx, part);
      await create_purchase_part(tx, part);
      await create_sales_part(tx, part);
    } catch (err) {
      throw err
    }
  }

  return new_revisions;
};

export const insert_structure_chain = async (tx: Connection, chain: Structure[], revisions: Record<string, string>, root: ExportPart) => {

  let count = 0;

  for (const { children } of chain) {
    for (const child of children) {
      const parent_new_rev = revisions[child.parentPartNumber + "_" + child.parentRevision]
      const child_new_rev = revisions[child.partNumber + "_" + child.revision];

      if (child_new_rev) {
        child.revision = child_new_rev;
      }

      if (parent_new_rev) {
        child.parentRevision = parent_new_rev;
      }

      await create_rev_structure(tx, child);
      count++
    }
  }

  const bad_apples: Record<string, { vault_count: number, ifs_count: number }> = {}

  for (const { children } of chain) {
    for (const child of children) {
      const child_rev = revisions[child.partNumber + "_" + child.revision] ?? child.revision;
      const ifs_count = await check_child_count(tx, { ...child, revision: child_rev })

      const match = chain.find((i) => i.parent.partNumber == child.partNumber && i.parent.revision == child.revision)

      const vault_count = match ? match.children.length : 0

      if (vault_count != ifs_count) {
        bad_apples[child.partNumber + "_" + child.revision] = { vault_count, ifs_count }
      }
    }
  }

  if (Object.keys(bad_apples).length != 0) {
    throw new IFSError(`IFS substructure does not match Vault`, "Insert Structure Chain", bad_apples)
  }

  const root_new_rev = revisions[root.partNumber + "_" + root.revision];

  if (root_new_rev) {
    root.revision = root_new_rev;
  }

  const sum = chain.reduce((sum, curr) => {
    return sum + curr.children.length
  }, 0)

  const size = await check_structure_size(tx, root)

  if (sum != size) {
    throw new CheckError(`IFS Structure does not match Vault Structure: Vault=${sum}, IFS=${size}, Count=${count}`)
  }
};

export const set_structure_state = async (tx: Connection, chain: Structure[], revisions: Record<string, string>) => {
  for (const struct of chain) {
    const parent = struct.parent;

    if (revisions[parent.partNumber + "_" + parent.revision]) {
      parent.revision = revisions[parent.partNumber + "_" + parent.revision]
    }

    await change_structure_state(tx, parent);
  }
};

export const check_revision_deviation = (parts: ExportPart[]) => {
  const map: Record<string, Set<string>> = {}

  for (const part of parts) {
    const prev = map[part.partNumber] || new Set<string>()
    prev.add(part.revision)
    map[part.partNumber] = prev
  }

  const bad_apples: Record<string, string[]> = {}

  for (const key of Object.keys(map)) {
    if (map[key].size > 1) {
      bad_apples[key] = [...map[key].values()]
    }
  }

  if (Object.keys(bad_apples).length != 0) {
    throw new IFSError(`Assembly has parts with more than 1 revision in use`, "Check Revision Deviation", bad_apples)
  }
} 
