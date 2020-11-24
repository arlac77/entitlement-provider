import { Interceptor } from "@kronos-integration/interceptor";
import { mergeAttributes, createAttributes } from "model-attributes";

/**
 * Map params into ldap queries. 
 */
export class LDAPQueryInterceptor extends Interceptor {
  /**
   * @return {string} 'ldap-query'
   */
  static get name() {
    return "ldap-query";
  }

  static get configurationAttributes() {
    return mergeAttributes(
      createAttributes({
        query: {
          description: "query template",
          default: {},
          type: "object"
        }
      }),
      Interceptor.configurationAttributes
    );
  }

  async receive(endpoint, next, params) {
    console.log("RECEIVE", params);

    function expand(str) {
      return str.replace(/\{\{(\w+)\}\}/, (match, g1) =>
        params[g1] ? params[g1] : g1
      );
    }

    const query = Object.fromEntries(
      Object.entries(this.query).map(([k, v]) => [k, expand(v)])
    );

    console.log(query, params);

    return next(query);
  }
}
