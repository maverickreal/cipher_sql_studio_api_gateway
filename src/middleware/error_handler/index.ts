import { NextFunction, Request, Response } from "express";
import { logger } from "../../config";

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error({ error: err }, "Unhandled error!");
  res.status(500).json({ error: "Internal Server Error" });
};

export default errorHandler;
