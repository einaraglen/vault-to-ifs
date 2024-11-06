import { Parser } from "../providers/xml/parser";
import { v4 as uuidv4 } from "uuid";
import { ChangeEvent } from "../utils/watcher";
import { Connection } from "../providers/ifs/internal/Connection";
import { PartHandler } from "./part_handler";
import { StructHandler } from "./struct_handler";
import { CommitError, TimeoutError } from "../utils/error";
import { sleep } from "../utils/tools";

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
        this.structHandler = new StructHandler(tx, this.partHandler)
    }

    public async exec() {
        try {
            const { unique, children, root } = this.parser.parse();

            for (const part of unique) {
                await this.partHandler.exec(part)
                await sleep()
            }

            // Throws if there are obsolete parts
            this.partHandler.checkObsolete();

            if (children != null) {
                for (const child of children) {
                    await this.structHandler.exec_child(child)
                    await sleep()
                }

                for (const child of [root, ...children]) {
                    await this.structHandler.exec_state(child)
                    await sleep()
                }

                // Throws if there are differences between IFS and Export data
                this.structHandler.checkChildCount(children)
            }

            // await this.commit()
            await this.rollback()
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

    private async rollback() {
        const rollback = this.tx.Rollback().then(() => true)
        const timeout = sleep(10000).then(() => false)

        const ok = await Promise.race([rollback, timeout])

        if (!ok) {
            throw new TimeoutError("Failed to rollback changes!", 10000)
        }
    }

    public close(status: Status) {
        // Stop further exec
        this.partHandler.stop()
        this.structHandler.stop()

        // Rollback all that is un-commited
        this.tx.Rollback()
            .then(() => this.tx.EndSession())

        console.log(`${status} [${this.event.name}] [${this.id}]`)
    }
}

