import { z } from "zod/v4";
import { ENV_MODE, SERVER_START_FAILURE_EXIT_CODE } from "../../utils/index.js";

const envVarsSchema = z.object({
  CLIENT_URL: z.url().nonempty().nonoptional(),
  SERVER_PORT: z.coerce.number().int().nonoptional(),
  MONGO_URI: z.url().nonempty().nonoptional(),
  REDIS_URL: z.url().nonempty().nonoptional(),
  BULLMQ_SQL_QUEUE_NAME: z.string().nonempty().nonoptional(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .nonoptional(),
  ENV_MODE: z.enum(ENV_MODE).nonoptional(),
  LOG_DIR: z.string().default("./logs"),
  INTERNAL_API_KEY: z.string().nonempty().nonoptional(),
  BETTER_AUTH_SECRET: z.string().min(32).nonoptional(),
  BETTER_AUTH_URL: z.url().nonempty().nonoptional(),
  ADMIN_SECRET_CODE: z.string().nonempty().nonoptional(),
});

const parsedEnvVarsBody = envVarsSchema.safeParse(process.env);

if (!parsedEnvVarsBody.success) {
  console.error(
    "Invalid environment variables:",
    z.prettifyError(parsedEnvVarsBody.error),
  );
  process.exit(SERVER_START_FAILURE_EXIT_CODE);
}

export default parsedEnvVarsBody.data;
