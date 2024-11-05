import { Parser } from "../providers/xml/parser";
import { v4 as uuidv4 } from "uuid";
import { ChangeEvent } from "../utils/watcher";
import { Connection } from "../providers/ifs/internal/Connection";
import { PartHandler } from "./part_handler";
import { StructHandler } from "./struct_handler";
import { CommitError } from "../utils/error";

export enum Status {
    Starting = "Starting",
    Completed = "Completed",
    Failure = "Failure"
}

export class Transaction {
    public id: string
    public parser: Parser
    public event: ChangeEvent;
    public tx: Connection

    private partHandler: PartHandler
    private structHandler: StructHandler

    constructor(event: ChangeEvent, tx: Connection) {
        this.id = uuidv4()
        this.event = event;
        this.tx = tx;

        console.log(`${Status.Starting} [${this.event.name}] [${this.id}]`)

        this.parser = new Parser(this.event.path)
        this.partHandler = new PartHandler(tx)
        this.structHandler = new StructHandler(tx)
    }

    public async exec() {
        try {
            const { unique, children } = this.parser.parse();

            for (const part of unique) {
                await this.partHandler.exec(part)
            }

            // haha scary fast, breaks IFS
            // await Promise.all(unique.map((part) => ))

            // TODO: should we have a map here, then set state after all direct children are added?
            // await Promise.all(children.map((part) => this.structHandler.exec(part)))

            await this.commit()
        } catch (err) {
            console.error(err)
            await this.rollback()
            throw err;
        }
    }

    private async commit() {
        const res = await this.tx.Commit()

        if (!res.ok) {
            throw new CommitError("Failed to commit changes!")
        }
    }

    private rollback() {
        return this.tx.Rollback()
    }

    public close(status: Status) {
        this.partHandler.stop()
        this.structHandler.stop()

        // Rollback all that is un-commited
        this.tx.Rollback()

        this.tx.EndSession();
        console.log(`${status} [${this.event.name}] [${this.id}]`)
    }
}

