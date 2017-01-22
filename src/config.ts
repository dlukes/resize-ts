interface AppConfig {
  appMount: string;
  viewEngine: string;
  viewPath: string;
  port: number;
}

export const Config: AppConfig = {
  appMount: "/resize",
  viewEngine: "pug",
  viewPath: "./views",
  port: 2727
}
