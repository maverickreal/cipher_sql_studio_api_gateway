import mongoose from "mongoose";
import { Client } from "pg";
import { envVars } from "../../config";
import { CacheClient } from "../../data";
import TaskQueueClient from "../job_queue";

type ComponentStatus = "ok" | "degraded";

interface HealthChecks {
  redis: ComponentStatus;
  mongodb: ComponentStatus;
  queue: ComponentStatus;
  sandbox_service: ComponentStatus;
  sandbox_db: ComponentStatus;
}

interface SystemHealthResult {
  status: "ok" | "degraded";
  checks: HealthChecks;
}

const checkRedis = async (): Promise<void> => {
  const cacheClient = await CacheClient.get();
  await cacheClient?.ping();
};

const checkMongoDb = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected");
  }

  await mongoose.connection.db?.admin().ping();
};

const checkQueue = async (): Promise<void> => {
  await TaskQueueClient.ping();
};

const checkSandboxService = async (): Promise<void> => {
  const workers = await TaskQueueClient.getWorkersCount();

  if (workers < 1) {
    throw new Error("No sandbox workers connected to the queue");
  }
};

const checkSandboxDb = async (): Promise<void> => {
  const client = new Client({
    host: envVars.SANDBOX_PG_HOST,
    port: envVars.SANDBOX_PG_PORT,
    user: envVars.SANDBOX_PG_USER,
    password: envVars.SANDBOX_PG_PASSWORD,
    database: envVars.SANDBOX_PG_DATABASE,
  });

  try {
    await client.connect();
    await client.query("SELECT 1");
  } finally {
    await client.end();
  }
};

const runCheck = async (
  check: () => Promise<void>,
): Promise<ComponentStatus> => {
  try {
    await check();
    return "ok";
  } catch {
    return "degraded";
  }
};

const runSystemHealthCheck = async (): Promise<SystemHealthResult> => {
  const [redis, mongodb, queue, sandbox_service, sandbox_db] =
    await Promise.all([
      runCheck(checkRedis),
      runCheck(checkMongoDb),
      runCheck(checkQueue),
      runCheck(checkSandboxService),
      runCheck(checkSandboxDb),
    ]);

  const checks: HealthChecks = {
    redis,
    mongodb,
    queue,
    sandbox_service,
    sandbox_db,
  };

  const status = Object.values(checks).every((value) => value === "ok")
    ? "ok"
    : "degraded";

  return { status, checks };
};

export type { ComponentStatus, HealthChecks, SystemHealthResult };
export { runSystemHealthCheck };
