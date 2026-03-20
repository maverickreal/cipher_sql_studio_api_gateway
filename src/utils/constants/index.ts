export const SERVER_START_FAILURE_EXIT_CODE = 1;
export const COMPRESSION_MIDDLEWARE_LEVEL = 6;
export const COMPRESSION_MIDDLEWARE_THRESHOLD = 1024;
export const CORS_ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE"];
export const EXPRESS_REQ_BODY_LIMIT = "1mb";
export const ASSIGNMENT_CACHE_TTL_S = 600;

export enum ASSIGNMENT_DIFFICULTY {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum ASSIGNMENT_ACCESS_LEVEL {
  READ = "read",
  WRITE = "write",
}

export const MAX_USER_SQL_CODE_LEN = 5000;
export const JOB_TTL_S = 600;

export const KILL_SIGNALS_TO_INTERCEPT = [
  "SIGTERM",
  "SIGINT",
  "UNHANDLED_REJECTION",
  "UNCAUGHT_EXCEPTION",
];

export const SERVER_KILL_SIGNAL_EXIT_CODE = 2;

export enum ENV_MODE {
  DEV = "DEV",
  STAGING = "STAGING",
  PROD = "PROD",
}

export const GLOBAL_RATE_LIMIT_WINDOW_SIZE = 60_000;
export const GLOBAL_RATE_LIMIT_PER_WINDOW = 100;
export const EXECUTE_RATE_LIMIT_WINDOW_SIZE = 60_000;
export const EXECUTE_RATE_LIMIT_PER_WINDOW = 10;
export const REDIS_RATE_LIMIT_KEY_PREFIX = "cipher_sql_studio_rate_limit:";
export const RATE_LIMIT_ERROR = "API endpoint rate limit reached!";

export const ASSIGNMENT_KEY_PREFIX = "client_sql_code_assignment:";
export const ASSIGNMENT_LIST_KEY = "client_sql_code_assignment:all";
export const ASSIGNMENT_SOLUTION_KEY_PREFIX =
  "client_sql_code_assignment_solution:";
export const BLLMQ_JOB_NAME = "client_sql_studio_sql_exec";
export const ADMIN_ASSIGNMENT_SEED_JOB_NAME =
  "client_sql_studio_admin_assignment_seed";
export const BULLMQ_JOB_FAILURE_MESSAGE = "BullMQ task failed!";
export const SANDBOX_DB_SCHEMA_PREFIX = "assignment_schema_";
export const ASSIGNMENT_SEED_JOB_MAX_ATTEMPTS = 3;
