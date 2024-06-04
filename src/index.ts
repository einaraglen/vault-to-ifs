import dotenv from "dotenv";
dotenv.config();

import("./service").then((service) => service.run());