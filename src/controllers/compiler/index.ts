import z from "zod";
import { getAssignmentByIdCached, TaskQueueClient } from "../../services";
import { MAX_USER_SQL_CODE_LEN } from "../../utils/constants";
import { Request, Response } from "express";


const SqlJobPayloadSchema = z.object({
  assignmentId: z.string().nonempty().nonoptional(),
  userSql: z.string().max(MAX_USER_SQL_CODE_LEN).nonempty().nonoptional(),
  mode: z.enum(["read", "write"]).nonoptional(),
  writeTables: z.array(z.string().nonempty().nonoptional()).optional(),
});

const run_client_sql_code = async (req: Request, res: Response) => {
  const bodyData = SqlJobPayloadSchema.parse(req.body);
  const assignment = await getAssignmentByIdCached(bodyData.assignmentId);

  if (!assignment) {    res.status(404).json({ error: "Couldn't find the assignment!" });
    return;
  }
  const assignmentSchema = `assignment_${bodyData.assignmentId}`;

  const taskId = await TaskQueueClient.enqueue({
    assignmentId: bodyData.assignmentId,
    userSql: bodyData.userSql,
    assignmentSchema,
    mode: bodyData.mode,
    writeTables: bodyData.writeTables,
  });

  res.status(202).json({ taskId });
};

export default run_client_sql_code;
