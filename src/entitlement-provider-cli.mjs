import program from "commander";
import { version, description } from "../package.json";
import ServiceSystemd from "@kronos-integration/service-systemd";
import ServiceKOA from "@kronos-integration/service-koa";

program
  .version(version)
  .description(description)
  .option("-c, --config <directory>", "use config from directory")
  .action(async () => {
    if(program.config) {
      process.env.CONFIGURATION_DIRECTORY = program.config;
    }

    try {
      const sm = new ServiceSystemd();
      sm.registerServiceFactory(ServiceKOA);
      const http = await sm.declareService(
        {
          name: "http",
          type: "koa"
        },
        true
      );

      await sm.start();
      await http.start();

      sm.info(sm.services.http.state);
    } catch (error) {
      console.log(error);
    }
  })
  .parse(process.argv);
