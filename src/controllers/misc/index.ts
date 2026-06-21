import type { Request, Response } from "express";
import { logger } from "../../config";
import { runSystemHealthCheck } from "../../services";

const system_health_check = async (_req: Request, res: Response) => {
  const result = await runSystemHealthCheck();

  if (result.status === "degraded") {
    logger.warn({ checks: result.checks }, "System health check degraded!");
    res.status(503).json(result);
    return;
  }

  res.status(200).json(result);
};

export { system_health_check };
