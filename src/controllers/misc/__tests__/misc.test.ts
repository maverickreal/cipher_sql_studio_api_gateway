import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRunSystemHealthCheck } = vi.hoisted(() => ({
  mockRunSystemHealthCheck: vi.fn(),
}));

vi.mock("../../../services", () => ({
  runSystemHealthCheck: mockRunSystemHealthCheck,
}));

vi.mock("../../../config", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { system_health_check } from "../index";

describe("system_health_check", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn();
    req = {};
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it("returns 200 with full health payload when all checks pass", async () => {
    const payload = {
      status: "ok" as const,
      checks: {
        redis: "ok" as const,
        mongodb: "ok" as const,
        queue: "ok" as const,
        sandbox_service: "ok" as const,
        sandbox_db: "ok" as const,
      },
    };
    mockRunSystemHealthCheck.mockResolvedValue(payload);

    await system_health_check(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(payload);
  });

  it("returns 503 with per-component status when any check fails", async () => {
    const payload = {
      status: "degraded" as const,
      checks: {
        redis: "ok" as const,
        mongodb: "ok" as const,
        queue: "ok" as const,
        sandbox_service: "degraded" as const,
        sandbox_db: "ok" as const,
      },
    };
    mockRunSystemHealthCheck.mockResolvedValue(payload);

    await system_health_check(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(503);
    expect(jsonMock).toHaveBeenCalledWith(payload);
  });
});
