import { Queue } from "bullmq";
import { type ServiceClient } from "../../types";
import { JOB_TTL_S } from "../../utils/constants";
import { logger, envVars } from "../../config";

interface SqlJobPayload {
  assignmentId: string;
  userSql: string;
  assignmentSchema: string;
  mode: "read" | "write";
  writeTables?: Array<string>;
}

interface JobStatusResponse {
  status: string;
  result?: unknown;
}

class TaskQueueClient {
  private static clientInst: Queue | null = null;
  private static queueName: string | null = null;

  static connect(name: string) {
    if (TaskQueueClient.queueName !== null) {
      if (TaskQueueClient.queueName !== name) {
        throw new Error("Connection to a different BullMQ queue seeked.");
      }

      return;
    }

    TaskQueueClient.clientInst = new Queue(name, {
      connection: { url: envVars.REDIS_URL },
    });
    TaskQueueClient.queueName = name;
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
      logger.error(
        { taskId, taskName: task.name, failedReason: task.failedReason },
        "BullMQ task failed",
      );
    }

    return respBodyData;
  }

  static async disconnect(): Promise<void> {
    if (TaskQueueClient.clientInst) {
      await TaskQueueClient.clientInst.close();
      TaskQueueClient.clientInst = null;
      TaskQueueClient.queueName = null;
    }
  }
}

export default TaskQueueClient satisfies ServiceClient;
