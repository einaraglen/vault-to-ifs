import { change_structure_state } from "@procedures/bom/change_structure_state";
import { create_rev_structure } from "@procedures/bom/create_rev_structure";
import { add_manufacturer } from "@procedures/parts/add_manufacturer";
import { add_technical_spesification } from "@procedures/parts/add_technical_spesification";
import { create_catalog_part } from "@procedures/parts/create_catalog_part";
import { create_engineering_part } from "@procedures/parts/create_engineering_part";
import { create_inventory_part } from "@procedures/parts/create_inventory_part";
import { create_purchase_part } from "@procedures/parts/create_purchase_part";
import { create_sales_part } from "@procedures/parts/create_sales_part";
import { MSSQLRow } from "@providers/mssql/types";
import { sleep, StructureChain } from "@utils/tools";
import { Connection } from "@providers/ifs/internal/Connection";

export const insert_unique_parts = async (tx: Connection, parts: MSSQLRow[]) => {
  const new_revisions: Record<string, string> = {};
  const created_revisions: Record<string, string> = {};

  for (const part of parts) {
    try {
      process.stdout.write(`Insert ${part.ItemNumber}`);

      const cat = await create_catalog_part(tx, part);
      const { unit } = cat.bindings as any;
  
      if (unit && part.Units && unit != part.Units) {
        part.Units = unit;
      }
  
      await add_technical_spesification(tx, part);
      await add_manufacturer(tx, part);
  
      const eng = await create_engineering_part(tx, part);
      const { part_rev, created } = eng.bindings as any;
  
      if (part_rev && part.Revision && part_rev != part.Revision) {
        process.stdout.write(` ${part_rev}`);
  
        new_revisions[part.ItemNumber!] = part_rev;
  
        if (created == "TRUE") {
          created_revisions[part.ItemNumber!] = part_rev;
        }
      } else {
        process.stdout.write(` ${part.Revision}`);
      }
  
      await create_inventory_part(tx, part);
      await create_purchase_part(tx, part);
      await create_sales_part(tx, part);
  
      process.stdout.write(`\n`); // end line print when success
  
      await sleep(100);
    } catch (err) {
      process.stdout.write(`\n`); // end line print when error
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

    const [parent_no, parent_rev] = parent.split(".");

    const parent_new_rev = revisions[parent_no];

    console.log("Part", parent_no, parent_new_rev || parent_rev);

    for (const child of children) {
      const child_new_rev = revisions[child.ItemNumber!];

      if (child_new_rev) {
        child.Revision = child_new_rev;
      }

      if (parent_new_rev) {
        child.ParentItemRevision = parent_new_rev;
      }

      console.log(`\tSub`, child.ItemNumber, child.Revision);
      await create_rev_structure(tx, child);

      await sleep(100);
    }
  }
};

export const set_structure_state = async (tx: Connection, chain: StructureChain, revisions: Record<string, string>) => {
  for (const [struct] of Object.entries(chain)) {
    const [no, rev, state] = struct.split(".");

    const new_rev = revisions[no];
    
    console.log(`Status`, no, new_rev || rev, state);

    await change_structure_state(tx, { ItemNumber: no, Revision: new_rev || rev, LifecycleState: state } as any);

    await sleep(100);
  }
};
