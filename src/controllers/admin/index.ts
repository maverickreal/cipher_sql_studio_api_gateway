import { Request, Response } from "express";
import { z } from "zod";
import {
  Assignment,
  AssignmentValidatorSchema,
} from "../../data/db/models/assignment";
import TaskQueueClient from "../../services/job_queue";
import { logger } from "../../config";

const adminAssignmentSchema = z.object({
  ...AssignmentValidatorSchema,
  initSql: z.string().nonempty().nonoptional(),
});

const create_assignment = async (req: Request, res: Response) => {
  const parsedBodyData = adminAssignmentSchema.parse(req.body);

  const { initSql, ...assignmentObj } = parsedBodyData;

  const freshAssignment = await Assignment.create(assignmentObj);

  logger.info(
    { assignmentId: freshAssignment._id },
    "Added new assignment to MongoDB.",
  );

  const jobId = await TaskQueueClient.enqueueAdminAssignmentSeedJob({
    assignmentId: freshAssignment._id,
    initSql: initSql,
  });

  res.status(201).json({
    assignmentId: freshAssignment._id,
    jobId,
  });
};

export default create_assignment;
