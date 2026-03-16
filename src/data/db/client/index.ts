import mongoose from "mongoose";
import { type ServiceClient } from "../../../types";
import { envVars, logger } from "../../../config";

class DBClient {
  private static clientInst: mongoose.Mongoose | null = null;

  static async connect() {
    if (DBClient.clientInst !== null) {
      return;
    }
    const uri = envVars.MONGO_URI;

    mongoose.connection.on("connected", () => {
      logger.info("Established MongoDB connection.");
    });

    mongoose.connection.on("error", (err: Error) => {
      logger.error({ err }, "Error in MongoDB connection!");
    });

    mongoose.connection.on("disconnected", () => {
      logger.info("Terminated MongoDB connection.");
    });
    DBClient.clientInst = await mongoose.connect(uri);
  }

  static async disconnect(): Promise<void> {
    if (DBClient.clientInst) {
      await mongoose.disconnect();
      DBClient.clientInst = null;
    }
  }
}

export default DBClient satisfies ServiceClient;
