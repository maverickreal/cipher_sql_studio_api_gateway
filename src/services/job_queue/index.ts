import { Queue } from "bullmq";
import { envVars } from "../../config";
import { type ServiceClient } from "../../types";
import { JOB_TTL_S } from "../../utils/constants";


interface SqlJobPayload {
  assignmentId: string;
  userSql: string;
  assignmentSchema: string;
  mode: "read" | "write";
  writeTables?: Array<string>;
};

interface JobStatusResponse {
  status: string;
  result?: unknown;
};

class TaskQueueClient {
  private static clientInst: Queue | null = null;
  private static connectionURI: string | null = null;

  static connect(uri: string) {
    if (TaskQueueClient.connectionURI !== null) {
      if (TaskQueueClient.connectionURI !== uri) {
        throw new Error(
          "Cannot connect to a different Redis URI after already connected",
        );
      }

      return;
    }

    TaskQueueClient.clientInst = new Queue(uri, {
      connection: { url: envVars.REDIS_URL },
    });
    TaskQueueClient.connectionURI = uri;
  }

  static async enqueue(data: SqlJobPayload) {
    const { id } = await TaskQueueClient.clientInst!.add(
      "client-sql-code-run",
      data,
      {
        removeOnComplete: { age: JOB_TTL_S },
        removeOnFail: { age: JOB_TTL_S },
      },
    );

    return id;
  }

  static async getStatus(taskId: string) {
    const task = await TaskQueueClient.clientInst!.getJob(taskId);

    if (!task) {
      return null;
    }
    const taskState = await task.getState();
    const respBodyData: JobStatusResponse = { status: taskState };

    if (taskState === "completed" && task.returnvalue) {
      respBodyData.result = task.returnvalue;
    } else if (taskState === "failed") {
      console.error(
        `BullMQ task with ID ${taskId} and
        name ${task.name} failed!\nFailure cause:
        ${task.failedReason}`,
      );
    }

    return respBodyData;
  }

  static async disconnect(): Promise<void> {
    if (TaskQueueClient.clientInst) {
      await TaskQueueClient.clientInst.close();
      TaskQueueClient.clientInst = null;
      TaskQueueClient.connectionURI = null;
    }
  }
}

export default TaskQueueClient satisfies ServiceClient;
