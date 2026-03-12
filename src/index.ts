import app from "./app";
import { envVars, establishConnections, logger } from "./config";
import { DBClient, CacheClient } from "./data";
import { TaskQueueClient } from "./services";
import {
  SERVER_START_FAILURE_EXIT_CODE,
  KILL_SIGNALS_TO_INTERCEPT,
  SERVER_KILL_SIGNAL_EXIT_CODE,
  BULL_QUEUE_NAME,
} from "./utils/constants";

app
  .listen(envVars.SERVER_PORT, () => {
    logger.info("Started the server.");

    establishConnections({
      cacheURI: envVars.REDIS_URL,
      dbURI: envVars.MONGO_URI,
      queueURI: BULL_QUEUE_NAME,
    });

    KILL_SIGNALS_TO_INTERCEPT.forEach((eventTag) => {
      process.on(eventTag, async () => {
        logger.info({ eventTag }, "Terminating the server due to kill signal!");

        await TaskQueueClient.disconnect();
        await CacheClient.disconnect();
        await DBClient.disconnect();

        process.exit(SERVER_KILL_SIGNAL_EXIT_CODE);
      });
    });
  })
  .on("error", (err: Error) => {
    logger.error({ err }, "Error starting the server!");
    process.exit(SERVER_START_FAILURE_EXIT_CODE);
  });
