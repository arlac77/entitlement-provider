import ServiceKOA from "@kronos-integration/service-koa";
import ServiceHealthCheck from "@kronos-integration/service-health-check";

import { setupKoaService } from "./koa-service.mjs";

export async function setup(sm) {
  const http = await sm.declareService(
    {
      name: "http",
      type: ServiceKOA
    }
  );

  const healthCheck = await sm.declareService(
    {
      type: ServiceHealthCheck
    }
  );

  setupKoaService(http);

  await sm.start();
  await http.start();
  await healthCheck.start();
}
