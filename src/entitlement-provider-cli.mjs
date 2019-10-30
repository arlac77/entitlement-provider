import { resolve } from "path";
import program from "commander";
import { expand } from "config-expander";
import { removeSensibleValues } from "remove-sensible-values";
import { version, description } from "../package.json";
import { defaultServerConfig, server } from "./server.mjs";
import { StandaloneServiceManager } from "@kronos-integration/service";
import ServiceSystemd from "@kronos-integration/service-systemd";

program
  .version(version)
  .description(description)
  .option("-c, --config <dir>", "use config directory")
  .action(async () => {
    const sm = new ServiceSystemd();

    const configDir = process.env.CONFIGURATION_DIRECTORY || program.config;

    const config = await expand(configDir ? "${include('config.json')}" : {}, {
      constants: {
        basedir: configDir || process.cwd(),
        installdir: resolve(__dirname, "..")
      },
      default: {
        version,
        ...defaultServerConfig
      }
    });

    console.log(removeSensibleValues(config));

    try {
      await server(config);
    } catch (error) {
      console.log(error);
    }
  })
  .parse(process.argv);
