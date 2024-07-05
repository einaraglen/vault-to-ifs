import { IFSConnection } from "@providers/ifs/connection";
import { MSSQLConnection } from "@providers/mssql/connection";
import { MailerConnection } from "@providers/smtp/client";
import { Server } from "@server/server";
import { Providers } from "@utils/providers";
import { Pooling } from "@utils/pooling";

export const run = async () => {
    await Providers.register(new IFSConnection())
    await Providers.register(new MSSQLConnection());
    await Providers.register(new MailerConnection())

    const server = new Server();
    server.start();

    const pooling = new Pooling();
    pooling.start();
};

process.on("exit", () => Providers.close())