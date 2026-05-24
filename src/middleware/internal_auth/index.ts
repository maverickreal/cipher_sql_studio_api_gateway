import { timingSafeEqual } from "crypto";
import { Request, Response, NextFunction } from "express";
import { envVars } from "../../config";

const reqHeadIntApiKeyValidMware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const provided = req.headers["x-internal-api-key"];

  if (typeof provided !== "string") {
    res.status(401).json({ error: "Unauthorized!" });

    return;
  }

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(envVars.INTERNAL_API_KEY);

  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    res.status(401).json({ error: "Unauthorized!" });

    return;
  }

  next();
};

export default reqHeadIntApiKeyValidMware;
