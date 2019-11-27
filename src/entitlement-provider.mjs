import { LoggingInterceptor } from "@kronos-integration/interceptor";
import ServiceKOA from "@kronos-integration/service-koa";
import ServiceHealthCheck from "@kronos-integration/service-health-check";
import ServiceLDAP from "@kronos-integration/service-ldap";
import ServiceAuthenticator from "@kronos-integration/service-authenticator";
import ServiceAdmin from "@kronos-integration/service-admin";

import {
  CTXInterceptor,
  CTXJWTVerifyInterceptor,
  CTXBodyParamInterceptor
} from "@kronos-integration/service-koa";

export async function setup(sp) {
  const GET = { interceptors: [/*CTXJWTVerifyInterceptor,*/ CTXInterceptor] };
  const POST = {
    method: "POST",
    interceptors: [CTXBodyParamInterceptor /*, LoggingInterceptor*/]
  };

  await sp.declareServices({
    http: {
      type: ServiceKOA,
      autostart: true,
      endpoints: {
        "/state": { ...GET, connected: "service(health).state" },
        "/state/uptime": { ...GET, connected: "service(health).uptime" },
        "/state/cpu": { ...GET, connected: "service(health).cpu" },
        "/state/memory": { ...GET, connected: "service(health).memory" },
        "/authenticate": { ...POST, connected: "service(auth).access_token" },
        "/services": { ...GET, connected: "service(admin).services" }
      }
    },
    auth: {
      type: ServiceAuthenticator,
      autostart: true,
      endpoints: {
        ldap: "service(ldap).authenticate"
      }
    },
    ldap: {
      type: ServiceLDAP
    },
    health: {
      type: ServiceHealthCheck
    },
    admin: {
      type: ServiceAdmin,
      autostart: true
    }
  });

  await sp.start();
}
