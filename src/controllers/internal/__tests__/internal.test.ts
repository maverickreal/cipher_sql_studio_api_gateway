import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { cleanup_assignment, confirm_assignment } from "../index.js";

const { mockDel } = vi.hoisted(() => ({
  mockDel: vi.fn(),
}));

vi.mock("../../../data/db/models/assignment/index.js", () => ({
  Assignment: {
    findByIdAndDelete: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("../../../data/db/models/assignment_solution/index.js", () => ({
  AssignmentSolution: {
    deleteOne: vi.fn(),
  },
}));

vi.mock("../../../data/index.js", () => ({
  CacheClient: {
    get: vi.fn().mockResolvedValue({ del: mockDel }),
  },
}));

vi.mock("../../../utils/index.js", () => ({
  ASSIGNMENT_KEY_PREFIX: "client_sql_code_assignment:",
}));

vi.mock("../../../config/index.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { Assignment } from "../../../data/db/models/assignment/index.js";
import { AssignmentSolution } from "../../../data/db/models/assignment_solution/index.js";

describe("cleanup_assignment", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockRequest = {
      params: { id: "507f1f77bcf86cd799439011" },
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  it("returns 404 when assignment is not found", async () => {
    vi.mocked(Assignment.findByIdAndDelete).mockResolvedValue(null);

    await cleanup_assignment(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ error: "Assignment not found" });
  });

  it("returns 200 and cleans up successfully", async () => {
    vi.mocked(Assignment.findByIdAndDelete).mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    vi.mocked(AssignmentSolution.deleteOne).mockResolvedValue({ deletedCount: 1 } as any);

    await cleanup_assignment(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({ success: true, assignmentId: "507f1f77bcf86cd799439011" });
    expect(Assignment.findByIdAndDelete).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(AssignmentSolution.deleteOne).toHaveBeenCalled();
  });

  it("returns 500 when cleanup fails", async () => {
    vi.mocked(Assignment.findByIdAndDelete).mockRejectedValue(new Error("Database error"));

    await cleanup_assignment(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: "Failed to cleanup assignment" });
  });
});

describe("confirm_assignment", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockRequest = {
      params: { id: "507f1f77bcf86cd799439011" },
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  it("returns 404 when assignment is not found", async () => {
    vi.mocked(Assignment.findByIdAndUpdate).mockResolvedValue(null);

    await confirm_assignment(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ error: "Assignment not found!" });
  });

  it("returns 200, updates pgSchemaReady, and invalidates cache", async () => {
    vi.mocked(Assignment.findByIdAndUpdate).mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    mockDel.mockResolvedValue(1);

    await confirm_assignment(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({ success: true, assignmentId: "507f1f77bcf86cd799439011" });
    expect(Assignment.findByIdAndUpdate).toHaveBeenCalledWith("507f1f77bcf86cd799439011", { pgSchemaReady: true });
    expect(mockDel).toHaveBeenCalledWith("client_sql_code_assignment:507f1f77bcf86cd799439011");
  });

  it("returns 500 when confirmation fails", async () => {
    vi.mocked(Assignment.findByIdAndUpdate).mockRejectedValue(new Error("Database error"));

    await confirm_assignment(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: "Assignment confirmation failed!" });
  });
});
