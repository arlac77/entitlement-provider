import Koa from "koa";
import program from "commander";
import { expand } from "config-expander";
import { removeSensibleValues } from "remove-sensible-values";
import BodyParser from "koa-bodyparser";
import Router from "koa-better-router";
import { version, description } from "../package.json";
import { accessTokenGenerator } from "./auth.mjs";

const Provider = require("oidc-provider");

export const defaultServerConfig = {
  jwt: {
    options: {
      algorithm: "RS256",
      expiresIn: "12h"
    }
  },
  ldap: {
    url: "ldap://ldap.mf.de",
    bindDN: "uid={{username}},ou=accounts,dc=mf,dc=de",
    entitlements: {
      base: "ou=groups,dc=mf,dc=de",
      attribute: "cn",
      scope: "sub",
      filter:
        "(&(objectclass=groupOfUniqueNames)(uniqueMember=uid={{username}},ou=accounts,dc=mf,dc=de))"
    }
  },


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
        ...defaultServerConfig
      }
    });

    const listeners = sd.listeners();
    if (listeners.length > 0) config.http.port = listeners[0];

    console.log(removeSensibleValues(config));

    try {
      await server();
    } catch (error) {
      console.log(error);
    }
  })
  .parse(process.argv);

async function server() {
  const configuration = {
    async findAccount(ctx, id) {
      return {
        accountId: id,
        async claims(use, scope) { return { sub: id }; },
      };
    },

    features: {
      introspection: { enabled: true },
      revocation: { enabled: true },
    },
    formats: {
      AccessToken: 'jwt',
    },
    clients: [{
      client_id: 'foo',
      client_secret: 'bar',
      redirect_uris: ['http://lvh.me:8080/cb']
    }],
  };

  const provider = new Provider('https://mfelten.dynv6.net:/services/entitlement-provider', configuration);
  
  const app = new Koa();

  const router = Router({
    notFound: async (ctx, next) => {
      console.log("route not found", ctx.request.url);
      return next();
    }
  });

  router.addRoute(
    "POST",
    "/authenticate",
    BodyParser(),
    accessTokenGenerator(config)
  );

  app.use(provider.app);

  let server = app.listen(config.http.port, () => {
    console.log("listen on", server.address());
    bus.sd.notify("READY=1\nSTATUS=running");
  });

  return server;
}
