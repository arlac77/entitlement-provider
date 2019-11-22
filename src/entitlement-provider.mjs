import ServiceKOA from "@kronos-integration/service-koa";
import ServiceHealthCheck from "@kronos-integration/service-health-check";
import Router from "koa-better-router";
import {
  CTXInterceptor,
  CTXBodyParamInterceptor,
  endpointRouter
} from "@kronos-integration/service-koa";
import { ServiceAuthenticator } from "./service-authenticator.mjs";
import { ServiceLDAP } from "./service-ldap.mjs";

export async function setup(sp) {
  const GET = { interceptors: [CTXInterceptor] };
  const POST = { method: "POST", interceptors: [CTXBodyParamInterceptor] };

  const services = await sp.declareServices({
    http: {
      type: ServiceKOA,
      endpoints: {
        "/state": GET,
        "/state/uptime": GET,
        "/state/cpu": GET,
        "/state/memory": GET,
        "/authenticate": POST
      }
    },
    auth: {
      type: ServiceAuthenticator,
      endpoints: {
        ldap: { direction: "out" }
      }
    },
    ldap: {
      type: ServiceLDAP,
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
    health: {
      type: ServiceHealthCheck
    }
  });

  const [koaService, authService, ldapService, healthService] = services;

  authService.endpoints.ldap.connected = ldapService.endpoints.authenticate;

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

  koaService.endpoints["/state/uptime"].connected =
    healthService.endpoints.uptime;
  koaService.endpoints["/state/memory"].connected =
    healthService.endpoints.memory;
  koaService.endpoints["/state/cpu"].connected = healthService.endpoints.cpu;
  koaService.endpoints["/state"].connected = healthService.endpoints.state;

  koaService.endpoints["/authenticate"].connected = authService.endpoints.token;

  koaService.koa.use(endpointRouter(koaService));

  await sp.start();
  await Promise.all(services.map(s => s.start()));
}
