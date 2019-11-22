import { Service } from "@kronos-integration/service";

export class ServiceAuthenticator extends Service {
  static get endpoints() {
    return {
      ...super.endpoints,
      authenticate: {
        default: true,
        receive: "authenticate"
      }
    };
  }

  async authenticate(request) {
    return { ...request, message: "auth..." };
  }
}
