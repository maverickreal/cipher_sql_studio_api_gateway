import mongoose from "mongoose";
import { type ServiceClient } from "../../../types";
import { logger } from "../../../config";

class DBClient {
  private static clientInst: mongoose.Mongoose | null = null;
  private static connectionURI: string | null = null;

  static async connect(uri: string) {
    if (DBClient.connectionURI !== null) {
      if (DBClient.connectionURI !== uri) {
        throw new Error("Another MongoDB connection client seeked!");
      }

      return;
    }

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
    DBClient.connectionURI = uri;
  }

  static async disconnect(): Promise<void> {
    if (DBClient.clientInst) {
      await mongoose.disconnect();
      DBClient.clientInst = null;
      DBClient.connectionURI = null;
    }
  }
}

export default DBClient satisfies ServiceClient;
