import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAssignmentByIdCached,
  getAssignmentSolutionByAssignmentIdCached,
} from "../index";

const mockGet = vi.fn();
const mockSetEx = vi.fn();
const mockExpire = vi.fn();

vi.mock("../../../data", () => ({
  CacheClient: {
    get: vi.fn(() => ({
      get: mockGet,
      setEx: mockSetEx,
      expire: mockExpire,
    })),
  },
  Assignment: {
    findById: vi.fn(),
    find: vi.fn(),
  },
  AssignmentSolution: {
    findOne: vi.fn(),
  },
}));

import { Assignment, AssignmentSolution } from "../../../data";
import {
  ASSIGNMENT_CACHE_TTL_S,
  ASSIGNMENT_KEY_PREFIX,
  ASSIGNMENT_SOLUTION_KEY_PREFIX,
} from "../../../utils/constants";

describe("getAssignmentByIdCached", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cached assignment when Redis has data", async () => {
    const cached = { _id: "1", title: "Test" };
    mockGet.mockResolvedValue(JSON.stringify(cached));

    const result = await getAssignmentByIdCached("1");

    expect(result).toEqual(cached);
    expect(mockExpire).toHaveBeenCalledWith(
      ASSIGNMENT_KEY_PREFIX + "1",
      ASSIGNMENT_CACHE_TTL_S,
    );
    expect(Assignment.findById).not.toHaveBeenCalled();
  });

  it("should query MongoDB and cache on cache miss", async () => {
    mockGet.mockResolvedValue(null);
    const dbDoc = { _id: "1", title: "Test" };
    (Assignment.findById as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(dbDoc),
    });

    const result = await getAssignmentByIdCached("1");

    expect(result).toEqual(dbDoc);
    expect(mockSetEx).toHaveBeenCalledWith(
      ASSIGNMENT_KEY_PREFIX + "1",
      ASSIGNMENT_CACHE_TTL_S,
      JSON.stringify(dbDoc),
    );
  });

  it("should not cache when assignment not found in DB", async () => {
    mockGet.mockResolvedValue(null);
    (Assignment.findById as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    const result = await getAssignmentByIdCached("missing");

    expect(result).toBeNull();
    expect(mockSetEx).not.toHaveBeenCalled();
  });
});

describe("getAssignmentSolutionByAssignmentIdCached", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cached solution when Redis has data", async () => {
    const cached = { assignmentId: "1", solutionSql: "SELECT 1" };
    mockGet.mockResolvedValue(JSON.stringify(cached));

    const result = await getAssignmentSolutionByAssignmentIdCached("1");

    expect(result).toEqual(cached);
    expect(mockExpire).toHaveBeenCalledWith(
      ASSIGNMENT_SOLUTION_KEY_PREFIX + "1",
      ASSIGNMENT_CACHE_TTL_S,
    );
    expect(AssignmentSolution.findOne).not.toHaveBeenCalled();
  });

  it("should query MongoDB and cache on cache miss", async () => {
    mockGet.mockResolvedValue(null);
    const dbDoc = { assignmentId: "1", solutionSql: "SELECT 1" };
    (AssignmentSolution.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(dbDoc),
    });

    const result = await getAssignmentSolutionByAssignmentIdCached("1");

    expect(result).toEqual(dbDoc);
    expect(mockSetEx).toHaveBeenCalledWith(
      ASSIGNMENT_SOLUTION_KEY_PREFIX + "1",
      ASSIGNMENT_CACHE_TTL_S,
      JSON.stringify(dbDoc),
    );
  });

  it("should not cache when solution not found in DB", async () => {
    mockGet.mockResolvedValue(null);
    (AssignmentSolution.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    const result = await getAssignmentSolutionByAssignmentIdCached("missing");

    expect(result).toBeNull();
    expect(mockSetEx).not.toHaveBeenCalled();
  });
});
