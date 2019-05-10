import { join } from "path";
import Koa from "koa";
import helmet from "koa-helmet";
import mount from "koa-mount";
import render from "koa-ejs";
import program from "commander";
import { expand } from "config-expander";
import { removeSensibleValues } from "remove-sensible-values";
import { version, description } from "../package.json";
import { Account } from "./account";
import { config } from "./config";

//const render = require("koa-ejs");
//const helmet = require("koa-helmet");
//const mount = require("koa-mount");

const Provider = require("oidc-provider"); // require('oidc-provider');

const {
  provider: providerConfiguration,
  clients,
  keys
} = require("./support/configuration");

const routes = require("./routes/koa");


export const defaultServerConfig = {
  http: {
    port: "${first(env.PORT,8094)}"
  }
};

program
  .version(version)
  .description(description)
  .option("-c, --config <dir>", "use config directory")
  .action(async () => {
    let sd = { notify: () => {}, listeners: () => [] };

    try {
      sd = await import("sd-daemon");
    } catch (e) {}

    sd.notify("READY=1\nSTATUS=starting");

    const configDir = process.env.CONFIGURATION_DIRECTORY || program.config;

    const config = await expand(configDir ? "${include('config.json')}" : {}, {
      constants: {
        basedir: configDir || process.cwd(),
        installdir: resolve(__dirname, "..")
      },
      default: {
        version,
        ...defaultServerConfig,
      }
    });

    const listeners = sd.listeners();
    if (listeners.length > 0) config.http.port = listeners[0];

    console.log(removeSensibleValues(config));

    try {
    } catch (error) {
      console.log(error);
    }
  })
  .parse(process.argv);


providerConfiguration.findById = Account.findById;

const app = new Koa();
app.use(helmet());
render(app, {
  cache: false,
  viewExt: "ejs",
  layout: "_layout",
  root: join(__dirname, "views")
});

const provider = new Provider(ISSUER, providerConfiguration);
if (TIMEOUT) {
  provider.defaultHttpOptions = { timeout: parseInt(TIMEOUT, 10) };
}

let server;
(async () => {
  await provider.initialize({
    adapter: undefined,
    clients: config.clients,
    keystore: { keys }
  });
  app.use(routes(provider).routes());
  app.use(mount(provider.app));
  server = app.listen(PORT, () => {
    console.log(
      `application is listening on port ${PORT}, check its /.well-known/openid-configuration`
    );
  });
})().catch(err => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
