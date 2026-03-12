import pinoHttp from "pino-http";
import { logger } from "../config";

const requestLogger = pinoHttp({ logger });

export { requestLogger };
