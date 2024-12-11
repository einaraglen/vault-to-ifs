import { Parser } from "../providers/xml/parser";
import { v4 as uuidv4 } from "uuid";
import { ChangeEvent } from "./watcher";
import { Connection } from "../providers/ifs/internal/Connection";
import { ExportPart } from "./tools";
import { PartHandler } from "../handlers/part";
import { StructureHandler } from "../handlers/structure";
import { StateHandler } from "../handlers/state";
import { IFSConnection } from "../providers/ifs/connection";

export enum Status {
  Starting = "Starting",
  Completed = "Completed",
  Failure = "Failure",
}

export class Transaction {
  private connection: IFSConnection

  public id: string;
  public parser: Parser;
  public event: ChangeEvent;
  public tx: Connection;

  private relations: Record<string, Set<string>> = {}

  constructor(event: ChangeEvent) {
    this.connection = new IFSConnection()

    this.id = uuidv4();
    this.event = event;
    this.tx = this.connection.begin();

    console.log(`${Status.Starting} [${this.event.name}] [${this.id}]`);

    this.parser = new Parser(this.event.path);
  }

  public async exec() {
    try {
      const { unique, children, root } = this.parser.parse();

      const partHandler = new PartHandler(this.tx);
      const structHandler = new StructureHandler(this.tx);
      const stateHandler = new StateHandler(this.tx);

      // console.log("Starting Unique Insert...")
      await partHandler.part(unique)

    
      this.writeLatest(root, partHandler)

      if (children == null) {
        await stateHandler.part(unique)
        await this.commit();
        return;
      }

      for (const child of children) {
        this.writeLatest(child, partHandler)
      }

      for (const child of children) {
          this.writeCount(child)
      }

      for (const part of [root, ...children]) {
        part.childCount = this.getCount(part).toString();
      }

      // console.log("Starting Structure Insert...")
      await structHandler.part(children)

      // console.log("Starting State Updates...")
      await stateHandler.part([root, ...children])

      await this.commit();
    } catch (err) {
      console.error(err);
      await this.rollback();
      throw err;
    }
  }

  private getCount(part: ExportPart) {
    const key = part.partNumber + "_" + part.revision
    return this.relations[key] ? this.relations[key].size : 0 
  }

  private writeCount(part: ExportPart) {
    const child_key = part.partNumber + "_" + part.partNumber
    const parent_key = part.parentPartNumber + "_" + part.parentRevision

    if (parent_key in this.relations) {
      this.relations[parent_key].add(child_key);
    } else {
      this.relations[parent_key] = new Set<string>()
      this.relations[parent_key].add(child_key)
    }
  }

  private writeLatest(part: ExportPart, partHandler: PartHandler) {
    const child_key = part.partNumber + "_" + part.revision
    const parent_key = part.parentPartNumber + "_" + part.parentRevision

    part.revision = partHandler.result.get(child_key) ?? part.revision
    part.parentRevision = partHandler.result.get(parent_key) ?? part.parentRevision
  }

  private async commit() {
    const res = await this.tx.Commit();

    if (!res.ok) {
      throw new Error("Failed to commit!")
    }
  }

  private async rollback() {
    const res = await this.tx.Rollback()

    if (!res.ok) {
      console.error("Failed to rollback changes!")
    }
  }

  public close(status: Status) {
    this.connection.close()
    console.log(`${status} [${this.event.name}] [${this.id}]`);
  }
}
