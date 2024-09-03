import { Insert } from "./procedures/handlers/import";
import { IFSConnection } from "./providers/ifs/connection";
import { MailerConnection } from "./providers/smtp/client";
import { Parser } from "./providers/xml/parser";
import { Providers } from "./utils/providers";
import { Watcher } from "./utils/watcher";

export const run = async () => {
  await Providers.register(new IFSConnection());
  await Providers.register(new MailerConnection());

  const watcher = new Watcher();

  watcher.on = async (event) => {
    try {
      const parser = new Parser(event);
      const job = new Insert(parser.parse());
      await job.start();
    } catch(err) {
      console.error(err)
    } finally {
      Watcher.clean(event);
    }
  };

  watcher.start();
};
