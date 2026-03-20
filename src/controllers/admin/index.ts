import { Request, Response } from "express";
import { z } from "zod/v4";
import {
  Assignment,
  AssignmentValidatorSchema,
  AssignmentSolution,
  AssignmentSolutionValidatorSchema,
} from "../../data";
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

  const {
    initSql,
    solutionSql,
    validationSql,
    orderMatters,
    ...assignmentObj
  } = parsedBodyData.data;

  let freshAssignment;

  try {
    freshAssignment = await Assignment.create(assignmentObj);

    await AssignmentSolution.create({
      assignmentId: freshAssignment._id,
      solutionSql,
      validationSql,
      orderMatters,
      initSql,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create assignment in MongoDB!");
    res.status(500).json({ error: "Failed to create the assignment!" });

    return;
  }

  logger.info(
    { assignmentId: freshAssignment._id },
    "Added new assignment to MongoDB.",
  );

  try {
    const jobId = await TaskQueueClient.enqueueAdminAssignmentSeedJob({
      assignmentId: freshAssignment._id,
      initSql: initSql,
    });

    res.status(201).json({
      assignmentId: freshAssignment._id,
      jobId,
    });
  } catch (err) {
    logger.error(
      { err, assignmentId: freshAssignment._id },
      `Failed to enqueue assignment sandbox seed job;
      Rolling back assignment and solution MongoDB objects!"`,
    );
    await Assignment.findByIdAndDelete(freshAssignment._id);
    await AssignmentSolution.deleteOne({
      assignmentId: freshAssignment._id,
    });
    res.status(500).json({ error: "Failed to enqueue seed job!" });

    return;
  }
};

export default create_assignment;
export { create_assignment };
