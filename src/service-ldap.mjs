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
          madatory: true,
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
   * @param {Object} props
   * @param {string} props.username
   * @param {string} props.password
   * @return {Set<string>} entitlements
   */
  async authenticate(props) {
    const { username, password } = props;

    const values = {
      username
    };

    function expand(str) {
      return str.replace(/\{\{(\w+)\}\}/, (match, g1) =>
        values[g1] ? values[g1] : g1
      );
    }

    try {
      this.trace(`bind ${expand(this.bindDN)}`);
      await this.client.bind(expand(this.bindDN), password);

      const searchOptions = {
        scope: this.entitlements.scope,
        filter: expand(this.entitlements.filter),
        attributes: [this.entitlements.attribute]
      };

      this.trace(`search ${expand(this.entitlements.base)} ${JSON.stringify(searchOptions)}`);

      const { searchEntries } = await this.client.search(
        expand(this.entitlements.base),
        searchOptions
      );

      const entitlements = new Set();

      searchEntries.forEach(e => {
        const entitlement = e[this.entitlements.attribute];
        entitlements.add(entitlement);
      });

      this.trace(`result ${[...entitlements]}`);

      return { username, entitlements };
    } finally {
      await client.unbind();
    }
  }
}
