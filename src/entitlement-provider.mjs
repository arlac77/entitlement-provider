import ServiceHealthCheck from "@kronos-integration/service-health-check";
import ServiceSMTP from "@kronos-integration/service-smtp";
import { ServiceLDAP } from "@kronos-integration/service-ldap";
import ServiceAuthenticator from "@kronos-integration/service-authenticator";
import ServiceAdmin from "@kronos-integration/service-admin";
import {
  DecodeJSONInterceptor,
  EncodeJSONInterceptor
} from "@kronos-integration/interceptor-decode-json";
import { TemplateInterceptor } from "@kronos-integration/interceptor";

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
        "/services": { ...WS, connected: "service(admin).services" },

        "/authenticate": { ...POST, connected: "service(auth).access_token" },

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
                scope: "children"
              }
            })
          ],
          connected: "service(ldap).search"
        },
        "/user/password": {
          method: "PATCH",
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
        "/user": {
          method: "PUT",
          interceptors: [
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
        "/user/:user": {
          method: "POST",
          interceptors: [
            ...GETInterceptors,
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
        "/user/:user": {
          method: "DEL",
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
    auth: {
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
      type: ServiceHealthCheck
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
