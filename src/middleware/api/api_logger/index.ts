import pinoHttp from "pino-http";
import { logger } from "../../../config";

const apiLogger = pinoHttp({ logger });

export default apiLogger;
