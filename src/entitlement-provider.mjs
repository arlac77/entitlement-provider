import ServiceKOA from "@kronos-integration/service-koa";
import ServiceHealthCheck from "@kronos-integration/service-health-check";
import Router from "koa-better-router";
import {
  BodyParserInterceptor,
  endpointRouter
} from "@kronos-integration/service-koa";
import { ServiceAuthenticator } from "./service-authenticator.mjs";

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

export async function setup(sp) {
  const services = await sp.declareServices({
    http: {
      type: ServiceKOA,
      endpoints: {
        "/state": {},
        "/state/uptime": {},
        "/state/cpu": {},
        "/state/memory": {},
        "/authenticate": {
          method: "POST",
          interceptors: [BodyParserInterceptor]
        }
      }
    },
    auth: {
      type: ServiceAuthenticator
    },
    health: {
      type: ServiceHealthCheck
    }
  });

  const [koaService, authService, healthService ] = services;

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

  koaService.koa.use(router.middleware());

  koaService.endpoints["/state/uptime"].connected = healthService.endpoints.uptime;
  koaService.endpoints["/state/memory"].connected = healthService.endpoints.memory;
  koaService.endpoints["/state/cpu"].connected = healthService.endpoints.cpu;
  koaService.endpoints["/state"].connected = healthService.endpoints.state;

  koaService.endpoints["/authenticate"].connected = authService.endpoints.authenticate;

  koaService.koa.use(endpointRouter(koaService));

  await sp.start();
  await Promise.all(services.map(s => s.start()));
}
