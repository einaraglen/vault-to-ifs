import { Parser } from "../providers/xml/parser";
import { v4 as uuidv4 } from "uuid";
import { ChangeEvent } from "./watcher";
import { Connection } from "../providers/ifs/internal/Connection";
import { create_catalog_part } from "../procedures/parts/create_catalog_part";
import { add_technical_spesification } from "../procedures/parts/add_technical_spesification";
import { add_manufacturer } from "../procedures/parts/add_manufacturer";
import { create_engineering_part } from "../procedures/parts/create_engineering_part";
import { create_inventory_part } from "../procedures/parts/create_inventory_part";
import { create_purchase_part } from "../procedures/parts/create_purchase_part";
import { create_sales_part } from "../procedures/parts/create_sales_part";
import { check_obsolete } from "../procedures/handlers/check_obsolete";
import { create_rev_structure } from "../procedures/bom/create_rev_structure";
import { change_structure_state } from "../procedures/bom/change_structure_state";
import { check_part_state } from "../procedures/parts/check_part_state";
import { ExportPart } from "./tools";
import { IFSError } from "./error";

export enum Status {
  Starting = "Starting",
  Completed = "Completed",
  Failure = "Failure",
}

export class Transaction {
  public id: string;
  public parser: Parser;
  public event: ChangeEvent;
  public tx: Connection;
  
  private revisions: Record<string, string> = {}
  private errors: Record<string, any[]> = {}

  constructor(event: ChangeEvent, tx: Connection) {
    this.id = uuidv4();
    this.event = event;
    this.tx = tx;

    console.log(`${Status.Starting} [${this.event.name}] [${this.id}]`);

    this.parser = new Parser(this.event.path);
  }

  public async exec() {
    try {
      const { unique, children, root } = this.parser.parse();

      for (const part of unique) {
        console.log("Insert Part", part.partNumber)
        const cat = await create_catalog_part(this.tx, part)
        const { unit } = cat.bindings as any;

        if (unit && part.units && unit != part.units) {
          part.units = unit;
        }

        await add_technical_spesification(this.tx, part)
        // await add_manufacturer(this.tx, part)

        const eng = await create_engineering_part(this.tx, part) as any

        let revision = part.revision

        if (eng?.bindings?.part_rev && part.revision && eng?.bindings?.part_rev != part.revision) {
          revision = eng?.bindings?.part_rev
          this.revisions[part.partNumber + "_" + part.revision] = eng?.bindings?.part_rev;
        }

        await create_inventory_part(this.tx, part)
        await create_purchase_part(this.tx, part)
        await create_sales_part(this.tx, part)

        const check = await check_part_state(this.tx, { ...part, revision } as any)
        const { state } = check.bindings as any;

        if (state == "Obsolete") {
          this.setError(part, new Error("Part Revisions is Obsolete"))
        }
      }

      if (Object.keys(this.errors).length != 0) {
        throw new IFSError("One or more parts has issues", "Insert Unique Parts", this.errors)
      }

      if (children != null) {
        for (const child of children) {
          const tmp = { ...child }

          if (this.revisions[tmp.partNumber + "_" + tmp.revision]) {
            tmp.revision = this.revisions[tmp.partNumber + "_" + tmp.revision]
          }

          if (this.revisions[tmp.parentPartNumber + "_" + tmp.parentRevision]) {
            tmp.parentRevision = this.revisions[tmp.parentPartNumber + "_" + tmp.parentRevision]
          }

          console.log("Insert Struct", tmp.partNumber)
          await create_rev_structure(this.tx, tmp)
        }

        for (const child of [root, ...children]) {
          const tmp = { ...child }

          if (this.revisions[tmp.partNumber + "_" + tmp.revision]) {
            tmp.revision = this.revisions[tmp.partNumber + "_" + tmp.revision]
          }

          if (this.revisions[tmp.parentPartNumber + "_" + tmp.parentRevision]) {
            tmp.parentRevision = this.revisions[tmp.parentPartNumber + "_" + tmp.parentRevision]
          }

          console.log("Change Struct", tmp.partNumber)
          await change_structure_state(this.tx, tmp)
        }

        // Throws if there are differences between IFS and Export data
        // this.structHandler.checkChildCount(children);
      }

      if (Object.keys(this.errors).length != null) {
        throw new IFSError("One or more parts has issues", "Build Assembly Structure", this.errors)
      }

      // await this.commit()
      await this.rollback();
    } catch (err) {
      console.error(err);
      await this.rollback();
      throw err;
    }
  }

  private async commit() {
    const res = await this.tx.Commit();

    if (!res.ok) {
      throw new Error("Failed to commit!")
      // throw new CommitError("Failed to commit changes!");
    }
  }

  private async rollback() {
    const res = await this.tx.Rollback()

    if (!res.ok) {
      console.log("Failed to rollback changes!")
    }
  }

  private setError(part: ExportPart, error: any) {
    const rev = this.revisions[part.partNumber + "_" + part.revision] ?? part.revision
    const id = part.partNumber + "_" + rev
    const prev = this.errors[id] || []
    const { name, message } = error as Error

    prev.push(`${name}: ${message}`)
    this.errors[id] = prev;

    return error;
  }

  public close(status: Status) {
    console.log(`${status} [${this.event.name}] [${this.id}]`);
  }
}
