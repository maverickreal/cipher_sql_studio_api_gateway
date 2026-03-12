import compression from "compression";
import { errorHandler } from "./error_handler";
import { requestLogger } from "./request_logger";
import {
    COMPRESSION_MIDDLEWARE_LEVEL,
    COMPRESSION_MIDDLEWARE_THRESHOLD
} from "../utils/constants";

const compression_mware = compression({
    level: COMPRESSION_MIDDLEWARE_LEVEL,
    threshold: COMPRESSION_MIDDLEWARE_THRESHOLD,
});

export { compression_mware, errorHandler, requestLogger };
