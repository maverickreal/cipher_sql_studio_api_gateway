import mongoose from "mongoose";
import {type ServiceClient} from "../../../types";

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
      console.log("Established MongoDB connection.");
    });

    mongoose.connection.on("error", (err: Error) => {
      console.error("Error in MongoDB connection!", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Terminated MongoDB connection.");
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
