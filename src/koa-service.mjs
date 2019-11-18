import Router from "koa-better-router";
import BodyParser from "koa-bodyparser";
import { RouteSendEndpoint, endpointRouter } from "@kronos-integration/service-koa";
import { SendEndpoint } from "@kronos-integration/endpoint";

import { accessTokenGenerator } from "./auth.mjs";

export const config = {
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
  }
};

export function setupKoaService(sp,koaService) {
  const router = Router({
    notFound: async (ctx, next) => {
      console.log("route not found", ctx.request.url);
      return next();
    }
  });

  router.addRoute("GET", "/hello", async (ctx, next) => {
    koaService.info("GET /hello");
    ctx.body = "hello world";
    return next();
  });

  router.addRoute(
    "POST",
    "/authenticate",
    BodyParser(),
    accessTokenGenerator(config)
  );

  koaService.koa.use(router.middleware());

  koaService.endpoints["/state/uptime"].connected = sp.getService('health').endpoints.uptime;
  koaService.endpoints["/state/memory"].connected = sp.getService('health').endpoints.memory;
  koaService.endpoints["/state/cpu"].connected = sp.getService('health').endpoints.cpu;
  koaService.endpoints["/state"].connected = sp.getService('health').endpoints.state;

  koaService.koa.use(endpointRouter(koaService));  
}
