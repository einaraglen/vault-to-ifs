import fs from "fs";
import { join, dirname, sep, extname, parse } from "path";
import { Transaction } from "./transaction";

export type ChangeEvent = { name: string, path: string }

type ChangeCallback = (event: ChangeEvent) => void | Promise<void>;

export class Watcher {
  private readonly FILE_EVENT = "rename";
  private readonly FILE_EXT = ".xml";
  private _on?: ChangeCallback;
  private directory: string;
  private listener: fs.FSWatcher | null = null

  constructor() {
    this.directory = process.env.VAULT_EXCHANGE_PATH;
  }

  public set on(callback: ChangeCallback) {
    this._on = callback;
  }

  private emit(filePath: string) {
    if (this._on && extname(filePath) == this.FILE_EXT) {
    const name = parse(filePath).name
      this._on({ name, path: filePath });
    }
  }

  public async start() {
    if (!this.isAccessable(this.directory)) {
      throw new Error("Failed to start watch, does this directory exist?: " + this.directory);
    }

    console.log("Watching for files...")

    const backlog = this.loadBacklog(this.directory);

    await this.flushBacklog(backlog);

    this.listener = fs.watch(this.directory, (type, name) => {
      if (type != this.FILE_EVENT || name == null) {
        return;
      }

      const path = join(this.directory, name);

      if (!this.isAccessable(path)) {
        return;
      }

      if (this.isDirectory(path)) {
        this.waitForFiles(path);
      }

      this.emit(path);
    });
  }

  private isAccessable(path: string) {
    try {
      fs.accessSync(path, fs.constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  private isDirectory(path: string) {
    try {
      const stats = fs.statSync(path);
      return stats.isDirectory();
    } catch (err) {
      return false;
    }
  }

  private waitForFiles(path: string, retries = 5, delay = 1000) {
    let attempt = 0;

    const interval = setInterval(() => {
      fs.readdir(path, (err, files) => {
        if (err) {
          clearInterval(interval);
          return;
        }

        if (files.length > 0) {
          clearInterval(interval);

          files.forEach((file) => {
            const filePath = join(path, file);
            this.emit(filePath);
          });
        } else {
          attempt++;
          if (attempt >= retries) {
            // stop trying
            clearInterval(interval);
          }
        }
      });
    }, delay);
  }

  private async flushBacklog(arr: string[]) {
    for (const path of arr) {
      await new Promise((r) => setTimeout(r, 1000));
      this.emit(path);
    }
  }

  private loadBacklog(path: string, arr: string[] = []) {
    const files = fs.readdirSync(path);

    files.forEach((file) => {
      const fullPath = join(path, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arr = this.loadBacklog(fullPath, arr);
      } else {
        arr.push(fullPath);
      }
    });

    return arr;
  }
  public close() {
    this.listener?.close()
  }

  public clean(transaction: Transaction, complete: boolean) {
    try {
      const root = join(process.env.VAULT_EXCHANGE_PATH);
      const destination = join(process.env.VAULT_COMPLETE_PATH)
      const parent = dirname(transaction.event.path);
      const fileExtension = extname(transaction.event.path)
      const fileName = parse(transaction.event.path).name

      const completeName = `${complete ? "DONE" : "FAIL"}-${transaction.id}${fileExtension}`
      const destinationFolder = join(destination, fileName)

      fs.mkdirSync(destinationFolder, { recursive: true });
      fs.copyFileSync(transaction.event.path, join(destinationFolder, completeName))
      fs.unlinkSync(transaction.event.path);

      if (!root.includes(parent.split(sep).reverse()[0])) {
        const files = fs.readdirSync(parent);

        if (files.length == 0) {
          fs.rmdirSync(parent);
        }
      }
    } catch (err) {
      console.error("File Cleanup Failure", err);
    }
  }
}
