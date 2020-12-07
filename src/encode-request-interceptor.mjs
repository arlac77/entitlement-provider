import { Interceptor } from "@kronos-integration/interceptor";

/**
 * only send endpoint identifier and the original body
 */
export class EncodeRequestInterceptor extends Interceptor {
  static get name() {
    return "encode-request";
  }

  async receive(endpoint, next, request) {
    request.endpoint = request.endpoint.identifier;
    const response = await next(JSON.stringify(request));
    return response === undefined ? undefined : JSON.parse(response);
  }
}
