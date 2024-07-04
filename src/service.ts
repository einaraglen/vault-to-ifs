import { IFSConnection } from "@providers/ifs/connection";
import { MSSQLConnection } from "@providers/mssql/connection";
import { MailerConnection } from "@providers/smtp/client";
import { Pooling } from "@utils/pooling";
import { Providers } from "@utils/providers";
import { StateMachine } from "@utils/state_machine";

export const run = async () => {
  let state: StateMachine;
  let pooling: Pooling;

  try {
    state = new StateMachine();
    pooling = new Pooling(state);
  
    Providers.register(new IFSConnection())
    Providers.register(new MSSQLConnection())
    Providers.register(new MailerConnection())
  
    pooling.start();
  } catch (err) {
    await Providers.close();
  }
};
