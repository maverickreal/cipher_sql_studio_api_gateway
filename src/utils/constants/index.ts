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

export const MAX_USER_SQL_CODE_LEN = 5000;
export const JOB_TTL_S = 600;

export const KILL_SIGNALS_TO_INTERCEPT = [
  "SIGTERM",
  "SIGINT",
  "UNHANDLED_REJECTION",
  "UNCAUGHT_EXCEPTION",
];

export const SERVER_KILL_SIGNAL_EXIT_CODE = 2;

export const enum ENV_MODE {
  DEV,
  STAGING,
  PROD,
}

export const ASSIGNMENT_KEY_PREFIX = "client_sql_code_assignment:";
export const ASSIGNMENT_LIST_KEY = "client_sql_code_assignment:all";
export const BULL_QUEUE_NAME = "cipher_sql_studio_queue";
