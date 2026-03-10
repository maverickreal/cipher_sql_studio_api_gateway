import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
  CORS_ALLOWED_METHODS,
  EXPRESS_REQ_BODY_LIMIT,
  KILL_SIGNALS_TO_INTERCEPT,
  SERVER_KILL_SIGNAL_EXIT_CODE,
  SERVER_START_FAILURE_EXIT_CODE,
} from "./utils/constants";
import apiV1Router from "./routes/api/v1/assignments";
import { DBClient, CacheClient } from "./data";
import {TaskQueueClient} from "./services";
import { envVars } from "./config";

const app = express();

const main = async () => {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: envVars.CLIENT_URL,
      methods: CORS_ALLOWED_METHODS,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: EXPRESS_REQ_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: EXPRESS_REQ_BODY_LIMIT }));

  app.use("/api/v1", apiV1Router);

  await DBClient.connect(envVars.MONGO_URI);
  await CacheClient.connect(envVars.REDIS_URL);

  app
    .listen(envVars.SERVER_PORT, () => {
      console.log(`Starting the server.`);
    })
    .on("error", (err: Error) => {
      console.error("Error starting the server!", err);
      process.exit(SERVER_START_FAILURE_EXIT_CODE);
    });

  KILL_SIGNALS_TO_INTERCEPT.forEach((eventTag) => {
    process.on(eventTag, async () => {
      console.log("Terminating the server due to kill signal!", eventTag);

      await TaskQueueClient.disconnect();
      await CacheClient.disconnect();
      await DBClient.disconnect();

      process.exit(SERVER_KILL_SIGNAL_EXIT_CODE);
    });
  });
};

main().catch((err) => {
  console.error("Failed starting the server!", err);
  process.exit(SERVER_START_FAILURE_EXIT_CODE);
});
