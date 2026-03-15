import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { CacheClient } from "../data";
import {
  GLOBAL_RATE_LIMIT_WINDOW_SIZE,
  GLOBAL_RATE_LIMIT_PER_WINDOW,
  REDIS_RATE_LIMIT_KEY_PREFIX,
  EXECUTE_RATE_LIMIT_WINDOW_SIZE,
  EXECUTE_RATE_LIMIT_PER_WINDOW,
  RATE_LIMIT_ERROR,
} from "../utils/constants";

const getRateLimitMware = (
  scope: string,
  limitPerWindow: number,
  windowSize: number,
): RateLimitRequestHandler => {
  const getRedisStoreForRateLimit = (prefix: string): RedisStore => {
    prefix = REDIS_RATE_LIMIT_KEY_PREFIX + prefix + ":";

    return new RedisStore({
      prefix,
      sendCommand: (...args: Array<string>) =>
        CacheClient.get().sendCommand(args),
      resetExpiryOnChange: true,
    });
  };

  return rateLimit({
    message: { message: RATE_LIMIT_ERROR },
    store: getRedisStoreForRateLimit(scope),
    legacyHeaders: false,
    standardHeaders: true,
    max: limitPerWindow,
    windowMs: windowSize,
    requestPropertyName: "rateLimit",
  });
};

export const GlobalRateLimitMware = getRateLimitMware(
  "global",
  GLOBAL_RATE_LIMIT_PER_WINDOW,
  GLOBAL_RATE_LIMIT_WINDOW_SIZE,
);

export const ExecuteRateLimitMware = getRateLimitMware(
  "execute",
  EXECUTE_RATE_LIMIT_PER_WINDOW,
  EXECUTE_RATE_LIMIT_WINDOW_SIZE,
);
