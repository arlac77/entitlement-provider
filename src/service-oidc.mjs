
import { mergeAttributes, createAttributes } from "model-attributes";
import { Service } from "@kronos-integration/service";
const Provider = require("oidc-provider");

/**
 *
 */
export class ServiceOIDC extends Service {
  static get configurationAttributes() {
    return mergeAttributes(
      Service.configurationAttributes,
      createAttributes({
        features: {
          attributes: {
            introspection: { enabled: true },
            revocation: { enabled: true },
          }
        }    
      })
    );
  }
  
  async _start() {
    await super._start();
    this.provider = new Provider('https://mfelten.dynv6.net/services/entitlement-provider', this);
  }
}
