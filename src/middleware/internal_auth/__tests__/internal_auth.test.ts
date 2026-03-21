import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import validateInternalApiKey from "../index";

vi.mock("../../../config", () => ({
  envVars: { INTERNAL_API_KEY: "test-api-key" },
}));

describe("validateInternalApiKey middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };
    next = vi.fn();
  });

  it("should call next() when API key is valid", () => {
    req = { headers: { "x-internal-api-key": "test-api-key" } };

    validateInternalApiKey(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should return 401 when API key is missing", () => {
    req = { headers: {} };

    validateInternalApiKey(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Unauthorized!" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when API key is invalid", () => {
    req = { headers: { "x-internal-api-key": "wrong-key" } };

    validateInternalApiKey(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Unauthorized!" });
    expect(next).not.toHaveBeenCalled();
  });
});
