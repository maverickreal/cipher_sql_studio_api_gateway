import { envVars } from "./src/config";

const migrationConfig = {
  autoSync: true,
  migrationsPath: "./db/migrations",
  collection: "migrations",
  uri: envVars.MONGO_URI,
};

export default migrationConfig;
