import { z } from "zod/v4";
import { SERVER_START_FAILURE_EXIT_CODE } from "../../utils";
import logger from "../log";

const envVarsSchema = z.object({
  CLIENT_URL: z.url().nonempty().nonoptional(),
  SERVER_PORT: z.coerce.number().int().nonoptional(),
  MONGO_URI: z.url().nonempty().nonoptional(),
  REDIS_URL: z.url().nonempty().nonoptional(),
  BULLMQ_SQL_QUEUE_NAME: z.string().nonempty().nonoptional(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .nonoptional(),
  ENV_MODE: z.enum(["dev", "staging", "prod"]).default("dev"),
  LOG_DIR: z.string().default("./logs"),
});

const parsedEnvVarsBody = envVarsSchema.safeParse(process.env);

if (!parsedEnvVarsBody.success) {
  logger.error(
    { trace: z.prettifyError(parsedEnvVarsBody.error) },
    "Invalid environment variables!",
  );
  process.exit(SERVER_START_FAILURE_EXIT_CODE);
}

export default parsedEnvVarsBody.data;
