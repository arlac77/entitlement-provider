import ServiceKOA from "@kronos-integration/service-koa";
import { setupKoaService } from "./koa-service.mjs";

export async function setup(sm) {
  const http = await sm.declareService(
    {
      name: "http",
      type: ServiceKOA
    }
  );

  setupKoaService(http);

  await sm.start();
  await http.start();
}
