import express, { Express } from "express";
import { router } from "./routes/router";
import chalk from "chalk";
import cors from "cors"

export class Server {
  private app: Express;

  constructor() {
    this.app = express();
    this.app.use(express.json())
    this.app.use(cors({ origin: "*" }));
    this.app.use(router)
  }

  public start() {
    this.app.listen(process.env.PORT, () => {
      console.log(chalk.greenBright("Express"), "running on port", chalk.blueBright(`${process.env.PORT}`));
    });
  }
}
