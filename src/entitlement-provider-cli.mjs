import program from "commander";
import { version, description } from "../package.json";
import { defaultServerConfig, server } from "./server.mjs";
import ServiceSystemd from "@kronos-integration/service-systemd";
import ServiceKOA from "@kronos-integration/service-koa";

program
  .version(version)
  .description(description)
  .action(async () => {
    try {
      const sm = new ServiceSystemd();
      sm.registerServiceFactory(ServiceKOA);
      sm.declareService(
        {
          name: "http",
          type: "koa"
        },
        true
      );

      await sm.start();
      //await server(config);
    } catch (error) {
      console.log(error);
    }
  })
  .parse(process.argv);
