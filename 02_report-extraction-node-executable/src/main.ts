import * as minimist from "minimist";

import { loadConfig } from './config';
import { getToken } from './auth';

const argv = minimist(process.argv.slice(2));

(async () => {
  try {
    const config = loadConfig(argv);
    const token = await getToken(config);

    // get all mappings for specified imodel

    // set 'extractionEnabled' to true for all mappings
    // maybe pass in list of mappingids and only set those to enabled??

    // run extraction

    // poll for status

    // fetch & display logs

  } catch (error) {
    console.error(error, "Unhandled exception thrown in my-agent");
    process.exitCode = 1;
  }
})();

process.on("unhandledRejection", (_reason, promise) => {
  console.error("Unhandled promise rejection at:", promise);
  process.exitCode = 1;
});