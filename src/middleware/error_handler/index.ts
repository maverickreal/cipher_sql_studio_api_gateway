import { Request, Response } from "express";
import { logger } from "../../config/index.js";

const errorHandler = (err: Error, _req: Request, res: Response) => {
  logger.error({ error: err }, "Unhandled error!");
  res.status(500).json({ error: "Internal Server Error" });
};

export default errorHandler;
