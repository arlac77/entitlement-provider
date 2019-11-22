import jwt from "jsonwebtoken";
import { mergeAttributes, createAttributes } from "model-attributes";
import { Service } from "@kronos-integration/service";

/**
 *
 */
export class ServiceAuthenticator extends Service {
  static get configurationAttributes() {
    return mergeAttributes(
      Service.configurationAttributes,
      createAttributes({
        jwt: {
          attributes: {
            private: {
              description: "private key for token",
              madatory: true,
              private: true,
              type: "blob"
            },
            public: {
              description: "public key for token",
              madatory: true,
              private: true,
              type: "blob"
            },
            options: {
              attributes: {
                algorithm: { default: "RS256", type: "string" },
                expiresIn: { default: "12h", type: "duration" }
              }
            }
          }
        }
      })
    );
  }

  static get endpoints() {
    return {
      ...super.endpoints,
      token: {
        default: true,
        receive: "accessTokenGenerator"
      }
    };
  }

  entitlementFilter(e) {
    return e;
  }

  /**
   * Generate a request handler to deliver JWT access tokens
   * @param {Object} params
   * @return request handler return jwt token
   */
  async accessTokenGenerator(params) {
    try {
      let entitlements = [];

      for (const e of this.outEndpoints) {
        const x = await e.receive(params);

        if (x.entitlements.length > 0) {
          entitlements = x.entitlements;
          break;
        }
      }

      entitlements = [entitlements].filter(e => this.entitlementFilter(e));

      if (entitlements.length > 0) {
        return jwt.sign(
          { entitlements: entitlements.join(",") },
          this.jwt.private,
          this.jwt.options
        );
      } else {
        throw new Error("Not authorized");
      }
    } catch (e) {
      this.error(e);
      throw new Error("Authentication failed");
    }
  }
}
