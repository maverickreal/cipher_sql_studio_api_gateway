import { Request, Response } from "express";
import { TaskQueueClient } from "../../services";

const get_job_status = async (req: Request, res: Response) => {
  const jobStatus = await TaskQueueClient.getStatus(`${req.params.taskId}`);

  if (!jobStatus) {
    res.status(404).json({ error: "Couldn't find the task!" });
  } else {
    res.status(200).json(jobStatus);
  }
};

export default get_job_status;
