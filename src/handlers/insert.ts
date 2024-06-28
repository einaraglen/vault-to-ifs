import { create_rev_structure } from "../procedures/bom/create_rev_structure";
import { add_technical_spesification } from "../procedures/parts/add_technical_spesification";
import { create_catalog_part } from "../procedures/parts/create_catalog_part";
import { create_engineering_part } from "../procedures/parts/create_engineering_part";
import { create_inventory_part } from "../procedures/parts/create_inventory_part";
import { create_purchase_part } from "../procedures/parts/create_purchase_part";
import { create_sales_part } from "../procedures/parts/create_sales_part";
import { Connection } from "../providers/ifs/internal/Connection";
import { InMessage, StructureChain } from "../utils";

export const insert_unique_parts = async (tx: Connection, parts: InMessage[]) => {
  const new_revisions: Record<string, string> = {};

  for (const part of parts) {
    process.stdout.write(`\Inserting ${part.c01} ${part.c02}`);
    await create_catalog_part(tx, part);
    await add_technical_spesification(tx, part);

    const res = await create_engineering_part(tx, part);
    const rev = (res.bindings as any).new_rev;

    if (rev) {
      process.stdout.write(` ${rev}`);
      new_revisions[part.c01!] = rev;
    }

    await create_inventory_part(tx, part);
    await create_purchase_part(tx, part);
    await create_sales_part(tx, part);

    process.stdout.write(`\n`);
    await new Promise((r) => setTimeout(r, 300));
  }

  return new_revisions;
};

export const insert_structure_chain = async (tx: Connection, chain: StructureChain, revisions: Record<string, string>) => {
  for (const [parent, children] of Object.entries(chain)) {
    console.log("Inserting Structure for", parent);

    for (const child of children) {
      const rev = revisions[child.c06!]

      if (rev) {
        child.c07 = rev;
      }

      console.log(`\tChild`, child.c06, child.c07);
      await create_rev_structure(tx, child);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
};

export const write_change_log = async (tx: Connection) => {};
