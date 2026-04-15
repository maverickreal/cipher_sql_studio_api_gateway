/*
 * An example of how to run:
 * E2E_TEST=true MONGO_HOST=127.0.0.1 REDIS_HOST=127.0.0.1 npm run test -- assignment_execution.e2e.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { createClient, RedisClientType } from "redis";
import { Assignment } from "../../data/db/models/assignment/index.js";
import { AssignmentSolution } from "../../data/db/models/assignment_solution/index.js";
import { REDIS_RATE_LIMIT_KEY_PREFIX } from "../../utils/index.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: [
    path.join(import.meta.dirname, ".env"),
    path.join(import.meta.dirname, "../../../../cipher_sql_studio/.env"),
  ],
  override: true,
});

// Fine tune these.
const API_GATEWAY_URL = `http://127.0.0.1:8000`;
const E2E_TEST_ASSIGNMENT_LIMIT = 10;
const MAX_POLL_RETRIES = 10;
const POLL_INTERVAL_DURATION = 5;
const PER_TEST_TIME_OUT = 30_000;

/*
 * The env vars must be passed through cmd line,
 * or be present in a local .env file. Some will
 * use default values if not passed.
 */
const {
  API_GATEWAY_MONGO_USER,
  API_GATEWAY_MONGO_PASSWORD,
  MONGO_PORT,
  API_GATEWAY_MONGO_DB,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_HOST,
  MONGO_HOST,
  E2E_TEST,
} = process.env;

const MONGO_URI =
  `mongodb://${API_GATEWAY_MONGO_USER}:${API_GATEWAY_MONGO_PASSWORD}@` +
  `${MONGO_HOST ?? "mongo"}:${MONGO_PORT ?? 27017}/${API_GATEWAY_MONGO_DB}`;
const REDIS_URI =
  `redis://:${REDIS_PASSWORD}` +
  `@${REDIS_HOST ?? "redis"}:${REDIS_PORT ?? 6379}`;

interface TestCase {
  name: string;
  sql: string;
  expectSuccess: boolean;
  expectPassed: boolean;
  skip?: boolean;
  skipReason?: string;
}

interface AssignmentData {
  assignment: {
    _id: { toString: () => string };
    mode: string;
    pgSchemaReady?: boolean | null;
  };
  solution: {
    solutionSql?: string | null;
    orderMatters: boolean;
  };
}

const generateTestCases = (assignmentData: AssignmentData): Array<TestCase> => {
  const { assignment, solution } = assignmentData;
  const isReadMode = assignment.mode === "read";
  const { solutionSql } = solution;
  const hasLimit = /\bLIMIT\b/i.test("" + solutionSql);

  const testCases: Array<TestCase> = [
    {
      name: "Correct solution SQL",
      sql: "" + solutionSql,
      expectSuccess: true,
      expectPassed: true,
    },
    {
      name: "SQL syntax error",
      sql: "SELEC * FROM unknown;",
      expectSuccess: false,
      expectPassed: false,
    },
    {
      name: "Non-existent table",
      sql: "SELECT * FROM nonexistent_table_xyz;",
      expectSuccess: false,
      expectPassed: false,
    },
    {
      name: "Wrong columns",
      sql: "SELECT 1 AS wrong_column_a, 2 AS wrong_column_b;",
      expectSuccess: true,
      expectPassed: false,
    },
    {
      name: "LIMIT 1 (wrong row count)",
      sql: hasLimit
        ? (solutionSql as string)
        : `SELECT * FROM (${solutionSql?.trim().replace(/;$/, "")}) AS _limit_wrapper LIMIT 1;`,
      expectSuccess: true,
      expectPassed: false,
      skip: !isReadMode || hasLimit,
      skipReason: !isReadMode
        ? "Write mode assignment"
        : "Solution already contains LIMIT",
    },
    {
      name: "Zero rows (WHERE 1=0)",
      sql: `SELECT * FROM (${solutionSql?.trim().replace(/;$/, "")}) AS _zero_rows_wrapper WHERE 1=0;`,
      expectSuccess: true,
      expectPassed: false,
      skip: !isReadMode,
      skipReason: "Write mode assignment",
    },
  ];

  if (solution.orderMatters && isReadMode) {
    const cleanSolution = solutionSql?.trim().replace(/;$/, "");

    testCases.push({
      name: "Wrong order (reversed)",
      sql: `SELECT * FROM (SELECT *, ROW_NUMBER() OVER () AS _rn FROM (${cleanSolution}) AS _inner) AS _wrong_order_wrapper ORDER BY _rn DESC;`,
      expectSuccess: true,
      expectPassed: false,
    });
  }

  return testCases;
};

describe.runIf(E2E_TEST === "true")("Assignment Execution E2E Test", () => {
  let assignmentsWithSolutions: Array<AssignmentData> = [];
  let redisClient: RedisClientType | null = null;

  const clearRateLimitKeys = async () => {
    if (!redisClient) {
      return;
    }
    const keys: Array<string> = [];
    let cursor: string = "0";

    do {
      const reply = (await redisClient.sendCommand([
        "SCAN",
        cursor,
        "MATCH",
        `${REDIS_RATE_LIMIT_KEY_PREFIX}*`,
      ])) as Array<unknown>;

      cursor = reply[0] as string;
      keys.push(...(reply[1] as Array<string>));
    } while (cursor !== "0");

    if (keys.length > 0) {
      await redisClient.sendCommand(["DEL", ...keys]);
    }
  };

  beforeAll(async () => {
    if (`${MONGO_URI}${REDIS_URI}`.includes("undefined")) {
      throw new Error("Environment variables must be set for E2E tests!");
    }
    await mongoose.connect(`${MONGO_URI}`);
    await (redisClient = createClient({ url: REDIS_URI })).connect();
    await clearRateLimitKeys();

    const assignments = await Assignment.find({ pgSchemaReady: true })
      .limit(E2E_TEST_ASSIGNMENT_LIMIT)
      .lean();

    for (const assignment of assignments) {
      const solution = await AssignmentSolution.findOne({
        assignmentId: assignment?._id,
      }).lean();

      if (solution) {
        assignmentsWithSolutions.push({ assignment, solution });
      }
    }
  });

  afterAll(async () => {
    await redisClient?.quit();
    await mongoose.disconnect();
  });

  const pollExecutionStatus = async (taskId: string) => {
    for (let attempts = 0; attempts < MAX_POLL_RETRIES; ++attempts) {
      const res = await fetch(
        `${API_GATEWAY_URL}/api/v1/assignments/client-sql-code-run/status/${taskId}`,
      );

      if (res.ok) {
        const body = await res.json();

        if (
          body.status === "failed" ||
          (body.status === "completed" && body.result !== undefined)
        ) {
          return body;
        }
      }
      await new Promise((resolve) =>
        setTimeout(resolve, POLL_INTERVAL_DURATION),
      );
    }
    throw new Error("Polling timed out!");
  };

  const executeCode = async (assignmentId: string, userSql: string) => {
    const res = await fetch(
      `${API_GATEWAY_URL}/api/v1/assignments/client-sql-code-run/execute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, userSql }),
      },
    );

    if (!res.ok) {
      throw new Error(
        `Execution failed with status ${res.status}: ${await res.text()}!`,
      );
    }
    return (await res.json()).taskId;
  };

  describe("Execution Endpoint Validation", () => {
    it("should return 400 for missing assignmentId and userSql", async () => {
      const res = await fetch(
        `${API_GATEWAY_URL}/api/v1/assignments/client-sql-code-run/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });

    it("should return 400 for invalid assignmentId format", async () => {
      const res = await fetch(
        `${API_GATEWAY_URL}/api/v1/assignments/client-sql-code-run/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: "invalid-id",
            userSql: "SELECT 1;",
          }),
        },
      );
      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent but valid format assignmentId", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await fetch(
        `${API_GATEWAY_URL}/api/v1/assignments/client-sql-code-run/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: nonExistentId,
            userSql: "SELECT 1;",
          }),
        },
      );
      expect(res.status).toBe(404);
    });
  });

  describe("Status Polling Validation", () => {
    it("should return 400 for invalid taskId format", async () => {
      const res = await fetch(
        `${API_GATEWAY_URL}/api/v1/assignments/client-sql-code-run/status/not-a-uuid`,
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });

    it("should return 404 for non-existent taskId", async () => {
      const randomUuid = "999999";
      const res = await fetch(
        `${API_GATEWAY_URL}/api/v1/assignments/client-sql-code-run/status/${randomUuid}`,
      );
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });
  });

  describe("Rate Limiting", () => {
    it("should block excessive requests to execution endpoint", async () => {
      await clearRateLimitKeys();
      if (assignmentsWithSolutions.length === 0) return;
      const assignmentId =
        assignmentsWithSolutions[0].assignment._id.toString();

      const requests = Array.from({ length: 15 }).map(() =>
        fetch(
          `${API_GATEWAY_URL}/api/v1/assignments/client-sql-code-run/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignmentId, userSql: "SELECT 1;" }),
          },
        ),
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter((r) => r.status === 429);
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe("Assignment Logic Testing", () => {
    it("should fetch at least one assignment for testing", () => {
      expect(assignmentsWithSolutions.length).toBeGreaterThan(0);
    });

    it(
      "should run comprehensive test cases for all assignments",
      async () => {
        for (const assignmentData of assignmentsWithSolutions) {
          await clearRateLimitKeys();
          const assignmentId = assignmentData.assignment._id.toString();
          const testCases = generateTestCases(assignmentData);

          for (const testCase of testCases) {
            if (testCase.skip) {
              continue;
            }

            const taskId = await executeCode(assignmentId, testCase.sql);
            const result = await pollExecutionStatus(taskId);

            expect(result.status).toBe("completed");
            expect(result.result.success).toBe(testCase.expectSuccess);

            if (testCase.expectSuccess) {
              expect(result.result.passed).toBe(testCase.expectPassed);
            } else {
              expect(result.result.error).toBeDefined();
            }
          }
        }
      },
      PER_TEST_TIME_OUT,
    );
  });
});
