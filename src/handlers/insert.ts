import { change_structure_state } from "../procedures/bom/change_structure_state";
import { create_rev_structure } from "../procedures/bom/create_rev_structure";
import { add_manufacturer } from "../procedures/parts/add_manufacturer";
import { add_technical_spesification } from "../procedures/parts/add_technical_spesification";
import { create_catalog_part } from "../procedures/parts/create_catalog_part";
import { create_engineering_part } from "../procedures/parts/create_engineering_part";
import { create_inventory_part } from "../procedures/parts/create_inventory_part";
import { create_purchase_part } from "../procedures/parts/create_purchase_part";
import { create_sales_part } from "../procedures/parts/create_sales_part";
import { Connection } from "../providers/ifs/internal/Connection";
import { Cursor, InMessage, StructureChain, sleep } from "../utils";

export const insert_unique_parts = async (tx: Connection, parts: InMessage[]) => {
  const new_revisions: Record<string, string> = {};
  const created_revisions: Record<string, string> = {};

  for (const part of parts) {
    process.stdout.write(`\Inserting ${part.c01} ${part.c02}`);

    const cat = await create_catalog_part(tx, part);
    const { unit } = cat.bindings as any;

    if (unit && part.c03 && unit != part.c03) {
      part.c03 = unit;
    }

    process.stdout.write(` ${part.c03}`);

    await add_technical_spesification(tx, part);
    await add_manufacturer(tx, part);

    const eng = await create_engineering_part(tx, part);
    const { part_rev, created } = eng.bindings as any;

    if (part_rev && part.c02 && part_rev != part.c02) {
      process.stdout.write(` ${part_rev}`);

      new_revisions[part.c01!] = part_rev;

      if (created == "TRUE") {
        created_revisions[part.c01!] = part_rev;
      }
    }

    await create_inventory_part(tx, part);
    await create_purchase_part(tx, part);
    await create_sales_part(tx, part);

    process.stdout.write(`\n`);

    await sleep(300);
  }

  return { new_revisions, created_revisions };
};

export const insert_structure_chain = async (tx: Connection, chain: StructureChain, revisions: Record<string, string>) => {
  for (const [parent, children] of Object.entries(chain)) {

    if (children.length == 0) {
      continue;
    }

    const [parent_no, parent_rev, state] = parent.split(".");

    const parent_new_rev = revisions[parent_no];

    console.log("Inserting Structure for", parent_no, parent_new_rev || parent_rev, state);

    for (const child of children) {
      const child_new_rev = revisions[child.c06!];

      if (child_new_rev) {
        child.c07 = child_new_rev;
      }

      if (parent_new_rev) {
        child.c03 = parent_new_rev;
      }

      console.log(`\tChild`, child.c06, child.c07);
      await create_rev_structure(tx, child);

      await sleep(300);
    }
  }
};

export const set_structure_state = async (tx: Connection, chain: StructureChain, revisions: Record<string, string>) => {
  for (const [struct] of Object.entries(chain)) {
    const [struct_no, struct_rev, state] = struct.split(".");

    const struct_new_rev = revisions[struct_no];
    
    console.log(`Setting State`, struct_no, struct_new_rev || struct_rev, state);

    await change_structure_state(tx, { c01: struct_no, c02: struct_new_rev || struct_rev, c18: state });
    await sleep(300);
  }
};