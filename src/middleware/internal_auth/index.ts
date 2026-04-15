import { Request, Response, NextFunction } from "express";
import { envVars } from "../../config/index.js";

const reqHeadIntApiKeyValidMware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.headers["x-internal-api-key"] !== envVars.INTERNAL_API_KEY) {
    res.status(401).json({ error: "Unauthorized!" });
  } else {
    next();
  }
};

export default reqHeadIntApiKeyValidMware;
