import { Request, Response } from "express";
import { Types } from "mongoose";
import { Assignment } from "../../data/db/models/assignment";
import { AssignmentSolution } from "../../data/db/models/assignment_solution";
import { logger, envVars } from "../../config";

const cleanup_assignment = async (req: Request, res: Response) => {
  const apiKey = req.headers["x-internal-api-key"];
  if (apiKey !== envVars.INTERNAL_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = req.params.id as string;

  if (!id || !Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid assignment ID" });
    return;
  }

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

export { cleanup_assignment };
