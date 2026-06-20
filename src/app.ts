import helmet from "helmet";
import { envVars, logger } from "./config";
import { CORS_ALLOWED_METHODS, EXPRESS_REQ_BODY_LIMIT } from "./utils";
import express, { Request, Response } from "express";
import cors from "cors";
import { apiV1Router, internalRouter } from "./routes";
import {
  errorHandler,
  apiLogger,
  GlobalRateLimitMware,
  compressionMware,
} from "./middleware/";
import { auth } from "./auth";
import { toNodeHandler } from "better-auth/node";
import { CacheClient } from "./data";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: envVars.CLIENT_URL,
    methods: CORS_ALLOWED_METHODS,
    credentials: true,
  }),
);

app.use(compressionMware);

app.get("/health", async (_req: Request, res: Response) => {
  try {
    const cacheClient = await CacheClient.get();
    await cacheClient!.ping();

    res.status(200).json({ status: "ok" });
  } catch (err) {
    logger.warn({ err }, "Health check failed!");
    res.status(503).json({ status: "degraded" });
  }
});

app.use(GlobalRateLimitMware);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: EXPRESS_REQ_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: EXPRESS_REQ_BODY_LIMIT }));

app.use(apiLogger);

app.use("/api/v1", apiV1Router);
app.use("/internal", internalRouter);

app.use(errorHandler);

export default app;
