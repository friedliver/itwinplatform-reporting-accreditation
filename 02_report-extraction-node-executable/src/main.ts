import * as minimist from "minimist";
import { ExtractionStatus, ReportingClient } from "@itwin/insights-client";

import { loadConfig } from "./config";
import { getToken } from "./auth";
import { delay } from "./utils";

const argv = minimist(process.argv.slice(2));

(async () => {
  try {
    const config = loadConfig(argv);
    const token = `Bearer ${(await getToken(config))?.access_token}`;
    const client = new ReportingClient();
    // get all mappings for specified imodel
    const mappings = await client.getMappings(token, config.IMODEL_ID);
    // set 'extractionEnabled' to true for all mappings
    // maybe pass in list of mappingids and only set those to enabled??
    for (const mapping of mappings) {
      if (!mapping.extractionEnabled && mapping.id) {
        await client.updateMapping(token, config.IMODEL_ID, mapping.id, {
          description: mapping.description,
          mappingName: mapping.mappingName,
          extractionEnabled: true
        });
      }
    }
    // run extraction
    const extraction = await client.runExtraction(token, config.IMODEL_ID);
    if (!extraction?.run?.id) throw new Error("Failed to trigger extraction");
    console.log("Extraction started....");
    console.log(` -- job: ${extraction.run.id}`);
    // poll for status
    let state: string | undefined = "";
    while (state !== "Completed") {
      const status = await client.getExtractionStatus(token, extraction.run.id);
      state = status?.status?.state;
      console.log(` ... waiting -- ${status.status?.state}:${status.status?.reason}`);
      await delay(10000);
    }
    // fetch & display logs
    const logs = await client.getExtractionLogs(token, extraction.run.id);
    console.log(logs);
  } catch (error) {
    console.error(error, "Unhandled exception thrown");
    process.exitCode = 1;
  }
})();

process.on("unhandledRejection", (_reason, promise) => {
  console.error("Unhandled promise rejection at:", promise);
  process.exitCode = 1;
});