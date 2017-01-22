import * as Express from "express";
import * as BodyParser from "body-parser";

import { AppController } from "./controllers";
import { Config } from "./config";

const app: Express.Application = Express();
const port: number = process.env.PORT || Config.port;

// configuration

app.set("view engine", Config.viewEngine);
app.set("views", Config.viewPath);
app.set("trust proxy", true);

// routing

app.use(Config.appMount, Express.static("public"));
app.use(BodyParser.json());
app.use(Config.appMount, AppController);

// start server

app.listen(port, () => {
  console.log(`Listening on localhost:${port}.`);
});
