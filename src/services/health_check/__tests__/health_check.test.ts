import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAdminPing,
  mockCachePing,
  mockQueuePing,
  mockGetWorkersCount,
  mockPgConnect,
  mockPgQuery,
  mockPgEnd,
} = vi.hoisted(() => ({
  mockAdminPing: vi.fn(),
  mockCachePing: vi.fn(),
  mockQueuePing: vi.fn(),
  mockGetWorkersCount: vi.fn(),
  mockPgConnect: vi.fn(),
  mockPgQuery: vi.fn(),
  mockPgEnd: vi.fn(),
}));

vi.mock("mongoose", () => ({
  default: {
    connection: {
      readyState: 1,
      db: {
        admin: () => ({
          ping: mockAdminPing,
        }),
      },
    },
  },
}));

vi.mock("../../../data", () => ({
  CacheClient: {
    get: vi.fn().mockResolvedValue({ ping: mockCachePing }),
  },
}));

vi.mock("../../job_queue", () => ({
  default: {
    ping: mockQueuePing,
    getWorkersCount: mockGetWorkersCount,
  },
}));

vi.mock("pg", () => ({
  Client: class MockPgClient {
    connect = mockPgConnect;
    query = mockPgQuery;
    end = mockPgEnd;
  },
}));

vi.mock("../../../config", () => ({
  envVars: {
    SANDBOX_PG_HOST: "localhost",
    SANDBOX_PG_PORT: 5432,
    SANDBOX_PG_DATABASE: "sandbox",
    SANDBOX_PG_USER: "sandbox_user",
    SANDBOX_PG_PASSWORD: "sandbox_pass",
  },
}));

import { runSystemHealthCheck } from "../index";

describe("runSystemHealthCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCachePing.mockResolvedValue("PONG");
    mockAdminPing.mockResolvedValue({ ok: 1 });
    mockQueuePing.mockResolvedValue(undefined);
    mockGetWorkersCount.mockResolvedValue(1);
    mockPgConnect.mockResolvedValue(undefined);
    mockPgQuery.mockResolvedValue({ rows: [{ "?column?": 1 }] });
    mockPgEnd.mockResolvedValue(undefined);
  });

  it("returns ok when all components are healthy", async () => {
    const result = await runSystemHealthCheck();

    expect(result).toEqual({
      status: "ok",
      checks: {
        redis: "ok",
        mongodb: "ok",
        queue: "ok",
        sandbox_service: "ok",
        sandbox_db: "ok",
      },
    });
  });

  it("returns degraded when redis is unavailable", async () => {
    mockCachePing.mockRejectedValue(new Error("redis down"));

    const result = await runSystemHealthCheck();

    expect(result.status).toBe("degraded");
    expect(result.checks.redis).toBe("degraded");
    expect(result.checks.mongodb).toBe("ok");
  });

  it("returns degraded when no sandbox workers are connected", async () => {
    mockGetWorkersCount.mockResolvedValue(0);

    const result = await runSystemHealthCheck();

    expect(result.status).toBe("degraded");
    expect(result.checks.sandbox_service).toBe("degraded");
  });

  it("returns degraded when sandbox db is unavailable", async () => {
    mockPgConnect.mockRejectedValue(new Error("connection refused"));

    const result = await runSystemHealthCheck();

    expect(result.status).toBe("degraded");
    expect(result.checks.sandbox_db).toBe("degraded");
  });
});
