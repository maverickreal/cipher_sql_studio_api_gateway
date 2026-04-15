import { CacheClient } from "../../data/index.js";
import { Assignment, AssignmentSolution } from "../../data/index.js";
import {
  ASSIGNMENT_CACHE_TTL_S,
  ASSIGNMENT_KEY_PREFIX,
  ASSIGNMENT_SOLUTION_KEY_PREFIX,
} from "../../utils/index.js";

const getAssignmentByIdCached = async (id: string) => {
  const cacheClient = (await CacheClient.get())!;
  const cacheKey = ASSIGNMENT_KEY_PREFIX + id;
  const cachedAssignment = await cacheClient.get(cacheKey);

  if (cachedAssignment) {
    await cacheClient.expire(cacheKey, ASSIGNMENT_CACHE_TTL_S);

    return JSON.parse(cachedAssignment);
  }

  const assignmentDB = await Assignment.findById(id).lean();

  if (assignmentDB) {
    await cacheClient.setEx(
      cacheKey,
      ASSIGNMENT_CACHE_TTL_S,
      JSON.stringify(assignmentDB),
    );
  }

  return assignmentDB;
};

const getAssignmentSolutionByAssignmentIdCached = async (
  assignmentId: string,
) => {
  const cacheClient = (await CacheClient.get())!;
  const cacheKey = ASSIGNMENT_SOLUTION_KEY_PREFIX + assignmentId;
  const cachedSolution = await cacheClient.get(cacheKey);

  if (cachedSolution) {
    await cacheClient.expire(cacheKey, ASSIGNMENT_CACHE_TTL_S);

    return JSON.parse(cachedSolution);
  }

  const solutionDB = await AssignmentSolution.findOne({
    assignmentId,
  }).lean();

  if (solutionDB) {
    await cacheClient.setEx(
      cacheKey,
      ASSIGNMENT_CACHE_TTL_S,
      JSON.stringify(solutionDB),
    );
  }

  return solutionDB;
};

export { getAssignmentByIdCached, getAssignmentSolutionByAssignmentIdCached };
