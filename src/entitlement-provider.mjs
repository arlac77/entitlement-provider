import { LoggingInterceptor } from "@kronos-integration/interceptor";
import ServiceKOA from "@kronos-integration/service-koa";
import ServiceHealthCheck from "@kronos-integration/service-health-check";
import ServiceLDAP from "@kronos-integration/service-ldap";
import {
  CTXInterceptor,
  CTXBodyParamInterceptor,
  endpointRouter
} from "@kronos-integration/service-koa";
import { ServiceAuthenticator } from "./service-authenticator.mjs";

export async function setup(sp) {
  const GET = { interceptors: [CTXInterceptor] };
  const POST = {
    method: "POST",
    interceptors: [CTXBodyParamInterceptor /*, LoggingInterceptor*/]
  };

  const services = await sp.declareServices({
    http: {
      type: ServiceKOA,
      endpoints: {
        "/state": { ...GET, connected: "service(health).state" },
        "/state/uptime": { ...GET, connected: "service(health).uptime" },
        "/state/cpu": { ...GET, connected: "service(health).cpu" },
        "/state/memory": { ...GET, connected: "service(health).memory" },
        "/authenticate": {...POST, connected: "service(auth).access_token" }
      }
    },
    auth: {
      type: ServiceAuthenticator,
      endpoints: {
        ldap: "service(ldap).authenticate"
      }
    },
    ldap: {
      type: ServiceLDAP
    },
    health: {
      type: ServiceHealthCheck
    }
  });

  const [koaService] = services;

  koaService.koa.use(endpointRouter(koaService));

  await sp.start();
  await Promise.all(services.map(s => s.start()));
}
