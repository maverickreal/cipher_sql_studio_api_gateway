import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAdd = vi.fn();
const mockGetJob = vi.fn();
const mockClose = vi.fn();
const mockQueueEventsClose = vi.fn();

vi.mock("bullmq", () => {
  return {
    Queue: class MockQueue {
      add = mockAdd;
      getJob = mockGetJob;
      close = mockClose;
      constructor() {}
    },
    QueueEvents: class MockQueueEvents {
      close = mockQueueEventsClose;
      constructor() {}
    },
  };
});

vi.mock("../../../config", () => ({
  envVars: { REDIS_URL: "redis://localhost:6379", BULLMQ_SQL_QUEUE_NAME: "test-queue" },
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import TaskQueueClient from "../index";

describe("TaskQueueClient", () => {
  beforeEach(async () => {
    await TaskQueueClient.disconnect();
    vi.clearAllMocks();
  });

  it("should allow enqueue after connect", async () => {
    TaskQueueClient.connect();
    mockAdd.mockResolvedValue({ id: "x" });

    const id = await TaskQueueClient.enqueue({
      assignmentId: "a1",
      userSql: "SELECT 1",
      assignmentSchema: "assignment_a1",
      mode: "read",
    });

    expect(id).toBe("x");
  });

  it("should no-op when connecting twice", () => {
    TaskQueueClient.connect();
    TaskQueueClient.connect();
  });

  it("should enqueue job and return id", async () => {
    TaskQueueClient.connect();
    mockAdd.mockResolvedValue({ id: "job-1" });

    const id = await TaskQueueClient.enqueue({
      assignmentId: "a1",
      userSql: "SELECT 1",
      assignmentSchema: "assignment_a1",
      mode: "read",
    });

    expect(id).toBe("job-1");
    expect(mockAdd).toHaveBeenCalledWith(
      "client_sql_studio_sql_exec",
      expect.objectContaining({ assignmentId: "a1" }),
      expect.any(Object),
    );
  });

  it("should enqueue admin assignment seed job and return id", async () => {
    TaskQueueClient.connect();
    mockAdd.mockResolvedValue({ id: "seed-1" });

    const id = await TaskQueueClient.enqueueAdminAssignmentSeedJob({
      assignmentId: "a1" as any,
      initSql: "CREATE TABLE t (id INT);",
    });

    expect(id).toBe("seed-1");
    expect(mockAdd).toHaveBeenCalledWith(
      "client_sql_studio_admin_assignment_seed",
      expect.objectContaining({ initSql: "CREATE TABLE t (id INT);" }),
      expect.any(Object),
    );
  });

  it("should return null when job not found", async () => {
    TaskQueueClient.connect();
    mockGetJob.mockResolvedValue(null);

    const result = await TaskQueueClient.getStatus("missing");

    expect(result).toBeNull();
  });

  it("should return status and result for completed job", async () => {
    TaskQueueClient.connect();
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue("completed"),
      returnvalue: { rows: [{ id: 1 }] },
      name: "test-job",
    });

    const result = await TaskQueueClient.getStatus("job-1");

    expect(result).toEqual({
      status: "completed",
      result: { rows: [{ id: 1 }] },
    });
  });

  it("should log error for failed job", async () => {
    TaskQueueClient.connect();
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue("failed"),
      returnvalue: null,
      name: "test-job",
      failedReason: "timeout",
    });

    const result = await TaskQueueClient.getStatus("job-1");

    expect(result).toEqual({ status: "failed", result: "BullMQ task failed!" });
  });

  it("should close queue on disconnect", async () => {
    TaskQueueClient.connect();

    await TaskQueueClient.disconnect();

    expect(mockClose).toHaveBeenCalled();
  });
});
