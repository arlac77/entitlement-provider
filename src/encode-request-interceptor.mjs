import { Interceptor } from "@kronos-integration/interceptor";

/**
 * Only send endpoint identifier and the original arguments.
 */
export class EncodeRequestInterceptor extends Interceptor {
  static get name() {
    return "encode-request";
  }

  async receive(endpoint, next, requestingEndpoint, ...args) {
    await next(
      JSON.stringify({ endpoint: requestingEndpoint.identifier, arguments: [...args] })
    );
  }
}
