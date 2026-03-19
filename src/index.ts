import app from "./app";
import { envVars, logger } from "./config";
import { DBClient, CacheClient } from "./data";
import { TaskQueueClient } from "./services";
import {
  SERVER_START_FAILURE_EXIT_CODE,
  KILL_SIGNALS_TO_INTERCEPT,
  SERVER_KILL_SIGNAL_EXIT_CODE,
} from "./utils";

app
  .listen(envVars.SERVER_PORT, async () => {
    logger.info("Started the server.");

    KILL_SIGNALS_TO_INTERCEPT.forEach((eventTag) => {
      process.on(eventTag, async () => {
        logger.info({ eventTag }, "Terminating the server due to kill signal!");

        await TaskQueueClient.disconnect();
        await CacheClient.disconnect();
        await DBClient.disconnect();

        process.exit(SERVER_KILL_SIGNAL_EXIT_CODE);
      });
    });

    await CacheClient.connect();
    await DBClient.connect();
    TaskQueueClient.connect();
  })
  .on("error", (err: Error) => {
    logger.error({ err }, "Error starting the server!");
    process.exit(SERVER_START_FAILURE_EXIT_CODE);
  });
