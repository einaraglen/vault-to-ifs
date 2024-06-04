import dotenv from "dotenv";
import { initLogger } from "./lib/log/logger";

dotenv.config();
initLogger();

import("./service").then((service) => service.run());