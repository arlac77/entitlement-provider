import program from "commander";
import { version, description } from "../package.json";
import ServiceSystemd from "@kronos-integration/service-systemd";
import { setup } from "./entitlement-provider.mjs";

program
  .version(version)
  .description(description)
  .option("-c, --config <directory>", "use config from directory")
  .action(async () => {
    if (program.config) {
      process.env.CONFIGURATION_DIRECTORY = program.config;
    }

    try {
      setup(new ServiceSystemd());
    } catch (error) {
      console.log(error);
    }
  })
  .parse(process.argv);
