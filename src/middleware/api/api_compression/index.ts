import compression from "compression";
import {
  COMPRESSION_MIDDLEWARE_LEVEL,
  COMPRESSION_MIDDLEWARE_THRESHOLD,
} from "../../../utils";

const compressionMware = compression({
  level: COMPRESSION_MIDDLEWARE_LEVEL,
  threshold: COMPRESSION_MIDDLEWARE_THRESHOLD,
});

export default compressionMware;
