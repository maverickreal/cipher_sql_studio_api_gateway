import pino from "pino";
import { envVars } from "..";

const logger = pino({
  level: envVars.LOG_LEVEL,
  redact: {
    paths: ["req.headers.*", "req.body.*"],
  },
});

export default logger;
