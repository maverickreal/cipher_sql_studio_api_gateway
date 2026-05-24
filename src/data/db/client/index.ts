import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { type ServiceClient } from "../../../types";
import { envVars, logger } from "../../../config";

export const sharedMongoClient = new MongoClient(envVars.MONGO_URI);

class DBClient {
  private static connected = false;

  static async connect() {
    if (DBClient.connected) {
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

    await sharedMongoClient.connect();
    mongoose.connection.setClient(sharedMongoClient);
    DBClient.connected = true;
  }

  static async disconnect() {
    if (DBClient.connected) {
      await mongoose.disconnect();
      await sharedMongoClient.close();
      DBClient.connected = false;
    }
  }
}

export default DBClient satisfies ServiceClient;
