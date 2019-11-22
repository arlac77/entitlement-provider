import ldapts from "ldapts";
import { mergeAttributes, createAttributes } from "model-attributes";
import { Service } from "@kronos-integration/service";

/**
 * LDAP
 */
export class ServiceLDAP extends Service {
  static get configurationAttributes() {
    return mergeAttributes(
      Service.configurationAttributes,
      createAttributes({
        url: {
          needsRestart: true,
          type: "url"
        },
        bindDN: {
          needsRestart: true,
          type: "string"
        },
        entitlements: {
          attributes: {
            base: {
              type: "string"
            },
            attribute: { default: "cn", type: "string" },
            scope: { default: "sub", type: "string" },
            filter: { type: "string" }
          }
        }
      })
    );
  }

  static get endpoints() {
    return {
      ...super.endpoints,
      authenticate: {
        default: true,
        receive: "authenticate"
      }
    };
  }

  async _start() {
    await super.start();
    this.client = new ldapts.Client({ url: this.url });
  }

  async _stop() {
    delete this.client;
    return super._strop();
  }

  /**
   * authorize user / password
   * @param {string} username
   * @param {string} password
   * @return {Set<string>} entitlements
   */
  async authenticate(username, password) {
    const entitlements = new Set();

    const values = {
      username
    };

    function expand(str) {
      return str.replace(/\{\{(\w+)\}\}/, (match, g1) =>
        values[g1] ? values[g1] : g1
      );
    }

    try {
      await this.client.bind(expand(this.bindDN), password);

      const { searchEntries } = await this.client.search(
        expand(this.entitlements.base),
        {
          scope: this.entitlements.scope,
          filter: expand(this.entitlements.filter),
          attributes: [this.entitlements.attribute]
        }
      );
      searchEntries.forEach(e => {
        const entitlement = e[this.entitlements.attribute];
        entitlements.add(entitlement);
      });
    } finally {
      await client.unbind();
    }

    return { entitlements };
  }
}
