import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import validateObjectId from "../index";

describe("validateObjectId middleware", () => {
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

  it("should call next() when id is valid", () => {
    req = { params: { id: "507f1f77bcf86cd799439011" } };

    validateObjectId("id")(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should return 400 when id is missing", () => {
    req = { params: {} };

    validateObjectId("id")(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "The provided assignmentId is invalid!" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 400 when id is invalid", () => {
    req = { params: { id: "invalid-id" } };

    validateObjectId("id")(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "The provided assignmentId is invalid!" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should use custom param name", () => {
    req = { params: { assignmentId: "507f1f77bcf86cd799439011" } };

    validateObjectId("assignmentId")(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
