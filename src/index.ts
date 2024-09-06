import dotenv from "dotenv";

dotenv.config();

import("./service").then(({ Service }) => {
    const service = new Service();
    service.run();
});