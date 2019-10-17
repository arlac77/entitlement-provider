import { resolve } from "path";
import program from "commander";
import { expand } from "config-expander";
import { removeSensibleValues } from "remove-sensible-values";
import { version, description } from "../package.json";
import { defaultServerConfig, server } from "./server.mjs";

program
  .version(version)
  .description(description)
  .option("-c, --config <dir>", "use config directory")
  .action(async () => {
    let sd = { notify: () => {}, listeners: () => [] };

    try {
      sd = await import("sd-daemon");
    } catch (e) {}

    sd.notify("READY=1\nSTATUS=starting");

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

    const listeners = sd.listeners();
    if (listeners.length > 0) config.http.port = listeners[0];

    console.log(removeSensibleValues(config));

    try {
      await server(config, sd);
    } catch (error) {
      console.log(error);
    }
  })
  .parse(process.argv);
