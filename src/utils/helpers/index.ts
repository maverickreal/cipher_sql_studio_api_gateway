import { SANDBOX_DB_SCHEMA_PREFIX } from "../constants";

export const getSandboxDBSchemaIdForAssignment = (seed: string): string =>
  SANDBOX_DB_SCHEMA_PREFIX + seed;
