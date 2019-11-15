import ServiceKOA from "@kronos-integration/service-koa";
import ServiceHealthCheck from "@kronos-integration/service-health-check";

import { setupKoaService } from "./koa-service.mjs";

export async function setup(sm) {
  const services = await sm.declareServices({
    http: {
      type: ServiceKOA
    },
    "health-check": {
      type: ServiceHealthCheck
    }
  });

  setupKoaService(sm, services[0]);

  await sm.start();
  await Promise.all(services.map(s => s.start()));
}
