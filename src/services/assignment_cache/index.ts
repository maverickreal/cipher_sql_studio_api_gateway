import { CacheClient } from "../../data";
import { Assignment } from "../../data";
import {
  ASSIGNMENT_CACHE_TTL_S,
  ASSIGNMENT_KEY_PREFIX,
  ASSIGNMENT_LIST_KEY,
} from "../../utils/constants";

const getAssignmentByIdCached = async (id: string) => {
  const cacheClient = (await CacheClient.get())!;
  const cachedAssignment = await cacheClient.get(ASSIGNMENT_KEY_PREFIX + id);

  if (cachedAssignment) {
    return JSON.parse(cachedAssignment);
  }

  const assignmentDB = await Assignment.findById(id).lean();

  if (assignmentDB) {
    await cacheClient.setEx(
      ASSIGNMENT_KEY_PREFIX + id,
      ASSIGNMENT_CACHE_TTL_S,
      JSON.stringify(assignmentDB),
    );
  }

  return assignmentDB;
};

const getAllAssignmentsCached = async () => {
  const cacheClient = (await CacheClient.get())!;
  const cachedAssignments = await cacheClient.get(ASSIGNMENT_LIST_KEY);

  if (cachedAssignments) {
    return JSON.parse(cachedAssignments);
  }
  const assignmentsDB = await Assignment.find().lean();

  await cacheClient.setEx(
    ASSIGNMENT_LIST_KEY,
    ASSIGNMENT_CACHE_TTL_S,
    JSON.stringify(assignmentsDB),
  );

  return assignmentsDB;
};

export { getAssignmentByIdCached, getAllAssignmentsCached };
