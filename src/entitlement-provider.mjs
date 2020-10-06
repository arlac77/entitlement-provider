import ServiceHealthCheck from "@kronos-integration/service-health-check";
import ServiceLDAP from "@kronos-integration/service-ldap";
import ServiceAuthenticator from "@kronos-integration/service-authenticator";
import ServiceAdmin from "@kronos-integration/service-admin";
import {
  DecodeJSONInterceptor,
  EncodeJSONInterceptor
} from "@kronos-integration/interceptor-decode-json";

import {
  ServiceHTTP,
  CTXInterceptor,
  CTXJWTVerifyInterceptor,
  CTXBodyParamInterceptor
} from "@kronos-integration/service-http";

export default async function setup(sp) {
  const bodyParamInterceptors = [new CTXBodyParamInterceptor()];
  const GETInterceptors = [new CTXJWTVerifyInterceptor(), new CTXInterceptor()];
  const GET = {
    interceptors: GETInterceptors
  };

  const POST = {
    method: "POST",
    interceptors: bodyParamInterceptors
  };
  
  const PATCH = {
    method: "PATCH",
    interceptors: bodyParamInterceptors
  };

  const WS = {
    ws: true,
    interceptors: [new DecodeJSONInterceptor()],
    receivingInterceptors :[new EncodeJSONInterceptor()]
  };

  await sp.declareServices({
    http: {
      type: ServiceHTTP,
      autostart: true,
      endpoints: {
        "/state/uptime": {
          ...WS,
          connected: "service(health).uptime"
        },
        "/state/cpu": {
          ...WS,
          connected: "service(health).cpu"
        },
        "/state/memory": {
          ...WS,
          connected: "service(health).memory"
        },
        "/services": { ...WS, connected: "service(admin).services" },

        "/authenticate": { ...POST, connected: "service(auth).access_token" },
        "/password": { ...PATCH, connected: "service(auth).change_password" },
        "/entitlements": { ...GET, connected: "service(ldap).search" }
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
