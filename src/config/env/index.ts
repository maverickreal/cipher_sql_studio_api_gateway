import { z } from "zod/v4";
import { SERVER_START_FAILURE_EXIT_CODE } from "../../utils/constants";

const envVarsSchema = z.object({
  CLIENT_URL: z.url().nonempty().nonoptional(),
  SERVER_PORT: z.coerce.number().int().nonoptional(),
  MONGO_URI: z.url().nonempty().nonoptional(),
  REDIS_URL: z.url().nonempty().nonoptional(),
  BULLMQ_SQL_QUEUE_NAME: z.string().nonempty().nonoptional(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .nonoptional(),
});

const parsedEnvVarsBody = envVarsSchema.safeParse(process.env);

if (!parsedEnvVarsBody.success) {
  console.error(
    "Invalid environment variables!",
    z.prettifyError(parsedEnvVarsBody.error),
  );
  process.exit(SERVER_START_FAILURE_EXIT_CODE);
}

export default parsedEnvVarsBody.data;
