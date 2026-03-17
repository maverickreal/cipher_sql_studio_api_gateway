import { Queue } from "bullmq";
import { type ServiceClient } from "../../types";
import {
  JOB_TTL_S,
  BLLMQ_JOB_NAME,
  ADMIN_ASSIGNMENT_SEED_JOB_NAME,
  BULLMQ_JOB_FAILURE_MESSAGE,
} from "../../utils/constants";
import { logger, envVars } from "../../config";
import { Types } from "mongoose";

interface SqlJobPayload {
  assignmentId: string;
  userSql: string;
  assignmentSchema: string;
  mode: "read" | "write";
  writeTables?: Array<string>;
}

export interface AdminAssignmentSeedJobPayload {
  assignmentId: Types.ObjectId;
  initSql: string;
}

interface JobStatusResponse {
  status: string;
  result?: unknown;
}

class TaskQueueClient {
  private static clientInst: Queue | null = null;

  static connect() {
    if (TaskQueueClient.clientInst !== null) {
      return;
    }

    TaskQueueClient.clientInst = new Queue(envVars.BULLMQ_SQL_QUEUE_NAME, {
      connection: {
        url: envVars.REDIS_URL,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: false,
      },
    });
  }

  static async enqueue(data: SqlJobPayload) {
    const { id } = await TaskQueueClient.clientInst!.add(BLLMQ_JOB_NAME, data, {
      removeOnComplete: { age: JOB_TTL_S },
      removeOnFail: { age: JOB_TTL_S },
    });

    return id;
  }

  static async enqueueAdminAssignmentSeedJob(
    data: AdminAssignmentSeedJobPayload,
  ) {
    const { id } = await TaskQueueClient.clientInst!.add(
      ADMIN_ASSIGNMENT_SEED_JOB_NAME,
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
        BULLMQ_JOB_FAILURE_MESSAGE,
      );
      respBodyData.result = BULLMQ_JOB_FAILURE_MESSAGE;
    }

    return respBodyData;
  }

  static async disconnect(): Promise<void> {
    if (TaskQueueClient.clientInst) {
      await TaskQueueClient.clientInst.close();
      TaskQueueClient.clientInst = null;
    }
  }
}

export default TaskQueueClient satisfies ServiceClient;
