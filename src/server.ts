import * as express from "express";
import { AppController } from "./controllers";
import { Config } from "./config";

const app: express.Application = express();
const port: number = process.env.PORT || 3000;

// configuration

app.set("view engine", Config.viewEngine);
app.set("views", Config.viewPath);
app.set("trust proxy", true);

// routing

app.use(Config.appMount, AppController);

// start server

app.listen(port, () => {
  console.log(`Listening at localhost:${port}.`);
});
