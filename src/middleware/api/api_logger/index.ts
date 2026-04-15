import pinoHttp from "pino-http";
import { logger } from "../../../config/index.js";

const apiLogger = pinoHttp({ logger });

export default apiLogger;
