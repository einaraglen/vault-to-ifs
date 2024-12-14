import fs from "fs";
import { join, dirname, sep, extname, parse } from "path";
import { Transaction } from "./transaction";
import { Future } from "./future";

export type ChangeEvent = { name: string; path: string };

type ChangeCallback = (transaction: Transaction) => void | Promise<void>;

export class Watcher {
  private readonly FILE_EVENT = "rename";
  private readonly FILE_EXT = ".xml";
  private _on?: ChangeCallback;
  private directory: string;
  private listener: fs.FSWatcher | null = null;

  private buffer: Set<Transaction> = new Set();
  private lock_: Future | null = null;

  public running: boolean = true;

  constructor() {
    this.directory = process.env.VAULT_EXCHANGE_PATH;
  }

  public set on(callback: ChangeCallback) {
    this._on = callback;
  }

  private emit(transaction: Transaction) {
    if (this._on) {
      this._on(transaction);
    }
  }

  public async start() {
    if (!this.isAccessable(this.directory)) {
      throw new Error(
        "Failed to start watch, does this directory exist?: " + this.directory
      );
    }

    console.log("Watching for files...");

    const backlog = this.loadBacklog(this.directory);

    for (const file of backlog) {
      this.queue(file);
    }

    this.listener = fs.watch(this.directory, (type, name) => {
      if (type != this.FILE_EVENT || name == null) {
        return;
      }

      const file = join(this.directory, name);

      if (!this.isAccessable(file)) {
        return;
      }

      if (this.isDirectory(file)) {
        this.waitForFiles(file);
      }

      this.queue(file);
    });

    while (this.running) {
      const file = this.pop();

      if (file) {
        this.lock();
        this.emit(file);
        await this.wait();
      }

      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  private queue(path: string) {
    if (extname(path) == this.FILE_EXT) {
      const name = parse(path).name;
      const transaction = new Transaction({ name, path: path });
      this.buffer.add(transaction);
    }
  }

  public unlock() {
    if (this.lock_ != null) {
      this.lock_.complete();
      this.lock_ = null;
    }
  }

  public lock() {
    if (this.lock_ == null) {
      this.lock_ = new Future();
    }
  }

  private async wait() {
    if (this.lock_ != null) {
      await this.lock_.wait();
    }
  }

  private pop() {
    const file = this.buffer.values().next().value;

    if (file) {
      this.buffer.delete(file);
    }

    return file;
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
            this.queue(filePath);
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
    this.running = false;
    this.listener?.close();
  }

  public clean(transaction: Transaction, complete: boolean) {
    try {
      const root = join(process.env.VAULT_EXCHANGE_PATH);
      const destination = join(process.env.VAULT_COMPLETE_PATH);
      const parent = dirname(transaction.event.path);
      const fileExtension = extname(transaction.event.path);
      const fileName = parse(transaction.event.path).name;

      const completeName = `${complete ? "DONE" : "FAIL"}-${
        transaction.id
      }${fileExtension}`;
      const destinationFolder = join(destination, fileName);

      fs.mkdirSync(destinationFolder, { recursive: true });
      fs.copyFileSync(
        transaction.event.path,
        join(destinationFolder, completeName)
      );
      fs.unlinkSync(transaction.event.path);

      if (!root.includes(parent.split(sep).reverse()[0])) {
        const files = fs.readdirSync(parent);

        if (files.length == 0) {
          fs.rmdirSync(parent);
        }
      }
    } catch (err) {
      console.error("WatcherError:", err);
    }
  }
}
