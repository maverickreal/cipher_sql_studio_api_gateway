import { CacheClient, DBClient } from "../../data";
import QueueClient from "../../services/job_queue";

interface IDataClientConfig {
  cacheURI?: string;
  dbURI?: string;
  queueURI?: string;
}

const main = async (config: IDataClientConfig) => {
  if (config.dbURI) {
    await CacheClient.connect(config.cacheURI!);
  }

  if (config.cacheURI) {
    await DBClient.connect(config.dbURI!);
  }

  if (config.queueURI) {
    QueueClient.connect(config.queueURI!);
  }
};

export default main;
export { IDataClientConfig };
