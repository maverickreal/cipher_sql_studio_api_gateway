import { createClient, RedisClientType } from "redis";
import { type ServiceClient } from "../../types";
import { logger, envVars } from "../../config";

class CacheClient {
  private static clientInst: RedisClientType | null = null;

  static async connect() {
    if (CacheClient.clientInst !== null) {
      return;
    }

    const cacheObj: RedisClientType = createClient({ url: envVars.REDIS_URL });

    cacheObj.on("error", (err: Error) => {
      logger.error({ err }, "Error in Redis connection!");
    });

    cacheObj.on("end", () => {
      logger.info("Terminated Redis connection.");
    });

    cacheObj.on("ready", () => {
      logger.info("Established Redis connection.");
    });

    await cacheObj.connect();
    CacheClient.clientInst = cacheObj;
  }

  static async disconnect() {
    if (CacheClient.clientInst) {
      await CacheClient.clientInst.quit();
      CacheClient.clientInst = null;
    }
  }

  static async get() {
    if (!CacheClient.clientInst) {
      await CacheClient.connect();
    }

    return CacheClient.clientInst;
  }
}

export default CacheClient satisfies ServiceClient;
