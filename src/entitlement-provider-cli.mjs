import program from "commander";
import { version, description } from "../package.json";
import { StandaloneServiceManager } from "@kronos-integration/service";
import { setup } from "./entitlement-provider.mjs";

program
  .version(version)
  .description(description)
  .option("-c, --config <directory>", "use config from directory")
  .action(async () => {
    if (program.config) {
    }

    try {
      setup(new StandaloneServiceManager());
    } catch (error) {
      console.log(error);
    }
  })
  .parse(process.argv);
