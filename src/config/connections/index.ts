import { CacheClient, DBClient } from "../../data";
import TaskQueueClient from "../../services/job_queue";


interface IDataClientConfig {
  cacheURI?: string;
  dbURI?: string;
  queueURI?: string;
};

const main = async (config: IDataClientConfig) => {
  if (config.dbURI) {
    await CacheClient.connect(config.dbURI!);
  }

  if (config.cacheURI) {
    await DBClient.connect(config.cacheURI!);
  }

  if (config.queueURI) {
    TaskQueueClient.connect(config.queueURI!);
  }
};

export default main;
export { IDataClientConfig };
