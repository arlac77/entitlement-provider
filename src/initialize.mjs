import ServiceHealth from "@kronos-integration/service-health";
import ServiceSMTP from "@kronos-integration/service-smtp";
import ServiceLDAP from "@kronos-integration/service-ldap";
import ServiceAuthenticator from "@kronos-integration/service-authenticator";
import {
  ServiceAdmin,
  LiveProbeInterceptor
} from "@kronos-integration/service-admin";
import {
  DecodeJSONInterceptor,
  EncodeJSONInterceptor
} from "@kronos-integration/interceptor-decode-json";
import { TemplateInterceptor } from "@kronos-integration/interceptor";
import { EncodeRequestInterceptor } from "./encode-request-interceptor.mjs";

import {
  ServiceHTTP,
  CTXInterceptor,
  CTXJWTVerifyInterceptor,
  CTXBodyParamInterceptor
} from "@kronos-integration/service-http";

export default async function initialize(sp) {
  sp.registerFactories([
    ServiceHTTP,
    ServiceLDAP,
    ServiceSMTP,
    ServiceAuthenticator,
    ServiceHealth,
    ServiceAdmin,
    TemplateInterceptor,
    DecodeJSONInterceptor,
    EncodeJSONInterceptor,
    CTXBodyParamInterceptor,
    CTXJWTVerifyInterceptor,
    CTXInterceptor,
    EncodeRequestInterceptor,
    LiveProbeInterceptor
  ]);

  const bodyParamInterceptors = [new CTXBodyParamInterceptor()];
  const GETInterceptors = [new CTXJWTVerifyInterceptor(), new CTXInterceptor()];
  const GET = {
    interceptors: GETInterceptors
  };

  const POST = {
    method: "POST",
    interceptors: bodyParamInterceptors
  };

  const WS = {
    ws: true,
    interceptors: [new DecodeJSONInterceptor()],
    receivingInterceptors: [new EncodeJSONInterceptor()]
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
        "/admin/services": { ...WS, connected: "service(admin).services" },
        "/admin/requests": {
          ws: true,
          interceptors: [new DecodeJSONInterceptor()],
          receivingInterceptors: [new EncodeRequestInterceptor()],
          connected: "service(admin).requests"
        },
        "/admin/command": { ...POST, connected: "service(admin).command" },

        "/authenticate": {
          ...POST,
          connected: "service(authenticator).access_token"
        },

        "/entitlement": {
          ...GET,
          interceptors: [
            ...GETInterceptors,
            new TemplateInterceptor({
              request: {
                base: "ou=groups,dc=mf,dc=de",
                scope: "children",
                attributes: ["cn"],
                filter: "(objectclass=groupOfUniqueNames)"
              }
            })
          ],
          connected: "service(ldap).search"
        },
        "/user": {
          ...GET,
          interceptors: [
            ...GETInterceptors,
            new TemplateInterceptor({
              request: {
                base: "ou=accounts,dc=mf,dc=de",
                scope: "children",
                filter: "(objectclass=posixAccount)"
              }
            }),
            new LiveProbeInterceptor()
          ],
          connected: "service(ldap).search"
        },
        "PUT:/user": {
          interceptors: [
            new CTXJWTVerifyInterceptor({
              requiredEntitlements: ["entitlement-provider.user.add"]
            }),
            ...bodyParamInterceptors,
            new TemplateInterceptor({
              request: {
                dn: "uid={{user}},ou=accounts,dc=mf,dc=de",
                entry: {
                  objectClass: [
                    "inetOrgPerson",
                    "organizationalPerson",
                    "person",
                    "top"
                  ],
                  cn: "{{user}}",
                  sn: "{{user}}",
                  userPassword: "{{password}}"
                }
              }
            })
          ],
          connected: "service(ldap).add"
        },
        "PATCH:/user/password": {
          interceptors: [
            ...bodyParamInterceptors,
            new TemplateInterceptor({
              request: {
                bind: {
                  dn: "uid={{user}},ou=accounts,dc=mf,dc=de",
                  password: "{{password}}"
                },
                dn: "uid={{user}},ou=accounts,dc=mf,dc=de",
                replace: {
                  userPassword: "{{new_password}}"
                }
              }
            })
          ],
          connected: "service(ldap).modify"
        },
        "PATCH:/user/:user": {
          interceptors: [
            new CTXJWTVerifyInterceptor({
              requiredEntitlements: ["entitlement-provider.user.modify"]
            }),
            ...bodyParamInterceptors,
            new TemplateInterceptor({
              request: {
                bind: {
                  dn: "uid={{user}},ou=accounts,dc=mf,dc=de",
                  password: "{{password}}"
                },
                dn: "uid={{user}},ou=accounts,dc=mf,dc=de",
                replace: {}
              }
            })
          ],
          connected: "service(ldap).modify"
        },
        "DELETE:/user/:user": {
          interceptors: [
            ...GETInterceptors,
            new TemplateInterceptor({
              request: {
                dn: "uid={{user}},ou=accounts,dc=mf,dc=de"
              }
            })
          ],
          connected: "service(ldap).del"
        },

        "/user/:user/entitlements": {
          ...GET,
          interceptors: [
            ...GETInterceptors,
            new TemplateInterceptor({
              request: {
                base: "ou=groups,dc=mf,dc=de",
                scope: "sub",
                attributes: ["cn"],
                filter:
                  "(&(objectclass=groupOfUniqueNames)(uniqueMember=uid={{user}},ou=accounts,dc=mf,dc=de))"
              }
            })
          ],
          connected: "service(ldap).search"
        }
      }
    },
    authenticator: {
      type: ServiceAuthenticator,
      autostart: true,
      endpoints: {
        "ldap.authenticate": "service(ldap).authenticate"
      }
    },
    ldap: {
      type: ServiceLDAP
    },
    health: {
      type: ServiceHealth
    },
    admin: {
      type: ServiceAdmin,
      autostart: true
    },
    smtp: {
      type: ServiceSMTP
    }
  });
  await sp.start();
}
