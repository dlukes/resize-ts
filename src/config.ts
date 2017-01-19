interface AppConfig {
  appMount: string;
  viewEngine: string;
  viewPath: string;
}

export const Config: AppConfig = {
  appMount: "/resize",
  viewEngine: "pug",
  viewPath: "./views"
}
