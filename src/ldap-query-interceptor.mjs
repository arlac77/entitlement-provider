import { Interceptor } from "@kronos-integration/interceptor";

/**
 * Extracts params from request body
 */
export class LDAPQueryInterceptor extends Interceptor {
  /**
   * @return {string} 'ldap-query'
   */
  static get name() {
    return "ldap-query";
  }

  async receive(endpoint, next, ctx, params) {
    return next({
      base: "ou=groups,dc=mf,dc=de",
      attribute: "cn",
      filter:
        "(&(objectclass=groupOfUniqueNames)(uniqueMember=uid=markus,ou=accounts,dc=mf,dc=de))"
    });
  }
}
