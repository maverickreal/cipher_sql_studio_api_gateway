import { Request, Response } from "express";
import { z } from "zod";
import {
  Assignment,
  AssignmentValidatorSchema,
} from "../../data/db/models/assignment";
import {
  AssignmentSolution,
  AssignmentSolutionValidatorSchema,
} from "../../data/db/models/assignment_solution";
import TaskQueueClient from "../../services/job_queue";
import { logger } from "../../config";

const adminAssignmentSchema = z.object({
  ...AssignmentValidatorSchema,
  ...AssignmentSolutionValidatorSchema,
  initSql: z.string().nonempty().nonoptional(),
});

const create_assignment = async (req: Request, res: Response) => {
  const parsedBodyData = adminAssignmentSchema.safeParse(req.body);

  if (!parsedBodyData.success) {
    res.status(400).json({ error: parsedBodyData.error.message });
    return;
  }

  const { initSql, solutionSql, validationSql, ...assignmentObj } =
    parsedBodyData.data;

  const freshAssignment = await Assignment.create(assignmentObj);

  await AssignmentSolution.create({
    assignmentId: freshAssignment._id,
    solutionSql,
    validationSql,
  });

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
