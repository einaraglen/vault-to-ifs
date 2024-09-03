import { Connection } from "../../providers/ifs/internal/Connection";
import { ExportPart, sleep, StructureChain } from "../../utils/tools";
import { change_structure_state } from "../bom/change_structure_state";
import { create_rev_structure } from "../bom/create_rev_structure";
import { add_manufacturer } from "../parts/add_manufacturer";
import { add_technical_spesification } from "../parts/add_technical_spesification";
import { create_catalog_part } from "../parts/create_catalog_part";
import { create_engineering_part } from "../parts/create_engineering_part";
import { create_inventory_part } from "../parts/create_inventory_part";
import { create_purchase_part } from "../parts/create_purchase_part";
import { create_sales_part } from "../parts/create_sales_part";

export const insert_unique_parts = async (tx: Connection, parts: ExportPart[]) => {
  const new_revisions: Record<string, string> = {};
  const created_revisions: Record<string, string> = {};

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
      const { part_rev, created } = eng.bindings as any;
  
      if (part_rev && part.revision && part_rev != part.revision) {
  
        new_revisions[part.partNumber!] = part_rev;
  
        if (created == "TRUE") {
          created_revisions[part.partNumber!] = part_rev;
        }
      }

      await create_inventory_part(tx, part);
      await create_purchase_part(tx, part);
      await create_sales_part(tx, part);
  
  
      await sleep(100);
    } catch (err) {
      throw err
    }
  }

  return { new_revisions, created_revisions };
};

export const insert_structure_chain = async (tx: Connection, chain: StructureChain, revisions: Record<string, string>) => {
  for (const [parent, children] of Object.entries(chain)) {

    if (children.length == 0) {
      continue;
    }

    const [parent_no] = parent.split(".");

    const parent_new_rev = revisions[parent_no];

    for (const child of children) {
      const child_new_rev = revisions[child.partNumber!];

      if (child_new_rev) {
        child.revision = child_new_rev;
      }

      if (parent_new_rev) {
        child.parentRevision = parent_new_rev;
      }

      await create_rev_structure(tx, child);

      await sleep(100);
    }
  }
};

export const set_structure_state = async (tx: Connection, chain: StructureChain, revisions: Record<string, string>) => {
  for (const [struct] of Object.entries(chain)) {
    const [no, rev, state] = struct.split(".");

    const new_rev = revisions[no];
    
    await change_structure_state(tx, { partNumber: no, revision: new_rev || rev, state } as any);

    await sleep(100);
  }
};
