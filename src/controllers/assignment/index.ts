import { getAssignmentByIdCached, getAllAssignmentsCached } from "../../services";
import { Request, Response } from "express";


const retrieve_all_assignments = async (_req: Request, res: Response) => {
  const assignments = await getAllAssignmentsCached();
  res.status(200).json({ assignments });
};

const retrieve_assignment = async (req: Request, res: Response) => {
  const assignment = await getAssignmentByIdCached(`${req.params.id}`);

  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
  } else {
    res.status(200).json({ assignment });
  }
};

export { retrieve_all_assignments, retrieve_assignment };
