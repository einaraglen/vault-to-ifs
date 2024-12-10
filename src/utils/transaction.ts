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
import { ExportPart, sleep } from "./tools";
import { IFSError } from "./error";
import { PartHandler } from "../handlers/part";
import { StructureHandler } from "../handlers/structure";
import { SerialHandler } from "../handlers/serial";

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

      const partHandler = new PartHandler(this.tx)
      const serialHandler = new SerialHandler(this.tx)
      const structHandler = new StructureHandler(this.tx)

      const dependencies = children?.reduce<Record<string, string[]>>((res, curr) => {
        const child_key = `${curr.partNumber}_${curr.revision}`
        const parent_key = `${curr.parentPartNumber}_${curr.parentRevision}`

        const prev = res[child_key] || []
        res[child_key] = [...prev, parent_key]
        return res;
      }, {})

      const serial_needed = new Set<string>()

      for (const part of unique) {
        const tracked = await partHandler.part(part)
        await sleep(100)

        if (tracked == "SERIAL TRACKING") {
          const key = `${part.partNumber}_${part.revision}`
          const parents = dependencies![key]

          for (const parent of parents) {
            serial_needed.add(parent)
          }
        }
      }

      if (children != null) {
        for (const child of children) {
          const prev_child = child.revision;
          const prev_parent = child.parentRevision

          if (partHandler.result.has(child.partNumber + "_" + child.revision)) {
            child.revision = partHandler.result.get(child.partNumber + "_" + child.revision)!
          }

          if (partHandler.result.has(child.parentPartNumber + "_" + child.parentRevision)) {
            child.parentRevision = partHandler.result.get(child.parentPartNumber + "_" + child.parentRevision)!
          }

          console.log(`${child.parentPartNumber}(${prev_parent}=>${child.parentRevision}) => ${child.partNumber}(${prev_child}=>${child.revision})`)
          await structHandler.part(child)
          await sleep(100)
        }
      }

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
