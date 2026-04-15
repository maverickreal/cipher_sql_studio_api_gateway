import { Request, Response } from "express";
import { Types } from "mongoose";
import { Assignment } from "../../data/db/models/assignment/index.js";
import { AssignmentSolution } from "../../data/db/models/assignment_solution/index.js";
import { CacheClient } from "../../data/index.js";
import { ASSIGNMENT_KEY_PREFIX } from "../../utils/index.js";
import { logger } from "../../config/index.js";

const cleanup_assignment = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const deletedAssignment = await Assignment.findByIdAndDelete(id);
    if (!deletedAssignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    await AssignmentSolution.deleteOne({
      assignmentId: new Types.ObjectId(id),
    });

    logger.info(
      { assignmentId: id },
      "Cleaned up orphaned assignment after schema creation failure",
    );

    res.status(200).json({ success: true, assignmentId: id });
  } catch (err) {
    logger.error({ err, assignmentId: id }, "Failed to cleanup assignment");
    res.status(500).json({ error: "Failed to cleanup assignment" });
  }
};

const confirm_assignment = async (req: Request, res: Response) => {
  const assignmentId = `${req.params.id}`;

  try {
    const sandboxUpdatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      {
        pgSchemaReady: true,
      },
    );

    if (!sandboxUpdatedAssignment) {
      res.status(404).json({ error: "Assignment not found!" });
      return;
    }

    const cacheClient = (await CacheClient.get())!;
    await cacheClient.del(ASSIGNMENT_KEY_PREFIX + assignmentId);

    logger.info(
      { assignmentId },
      `Uncached assignment ${assignmentId} and set 'pgSchemaReady=true'.`,
    );

    res.status(200).json({ success: true, assignmentId });
  } catch (err) {
    logger.error(
      { assignmentId },
      `Failed at updating the pgSchemaReady field for assignment ${assignmentId}!`,
    );
    res.status(500).json({ error: "Assignment confirmation failed!" });
  }
};

export { cleanup_assignment, confirm_assignment };
