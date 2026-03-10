import { createClient, RedisClientType } from "redis";
import {type ServiceClient} from "../../types";

class CacheClient {
  private static clientInst: RedisClientType | null = null;
  private static connectionURI: string | null = null;

  static async connect(uri: string): Promise<RedisClientType> {
    if (CacheClient.clientInst !== null) {
      if (CacheClient.connectionURI !== uri) {
        throw new Error("Another Redis connection client seeked!");
      }

      return CacheClient.clientInst;
    }

    const cacheObj: RedisClientType = createClient({ url: uri });

    cacheObj.on("error", (err: Error) => {
      console.error("Error in Redis connection!", err.message);
    });

    cacheObj.on("end", () => {
      console.log("Terminated Redis connection.");
    });

    cacheObj.on("ready", () => {
      console.log("Established Redis connection.");
    });

    await cacheObj.connect();
    CacheClient.clientInst = cacheObj;
    CacheClient.connectionURI = uri;

    return CacheClient.clientInst;
  }

  static async disconnect() {
    if (CacheClient.clientInst) {
      await CacheClient.clientInst.quit();
      CacheClient.clientInst = null;
      CacheClient.connectionURI = null;
    }
  }

  static get() {
    if (!CacheClient.clientInst) {
      throw new Error("Null cache client instance seeked!")
    }

    return CacheClient.clientInst;
  }
}

export default CacheClient satisfies ServiceClient;
