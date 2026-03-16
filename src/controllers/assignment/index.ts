import { Types } from "mongoose";
import {
  getAssignmentByIdCached,
  getAllAssignmentsCached,
} from "../../services";
import { Request, Response } from "express";

const retrieve_all_assignments = async (_req: Request, res: Response) => {
  const assignments = await getAllAssignmentsCached();
  res.status(200).json({ assignments });
};

const retrieve_assignment = async (req: Request, res: Response) => {
  const reqId = req.params.id as string;

  if (!Types.ObjectId.isValid(reqId)) {
    res.status(400).json({ error: "Invalid assignment ID provided!" });
    return;
  }

  const assignment = await getAssignmentByIdCached(reqId);

  if (!assignment) {
    res.status(404).json({ error: "Assignment not found!" });
  } else {
    res.status(200).json({ assignment });
  }
};

export { retrieve_all_assignments, retrieve_assignment };
