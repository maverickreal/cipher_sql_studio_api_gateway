import helmet from "helmet";
import { envVars } from "./config";
import { CORS_ALLOWED_METHODS, EXPRESS_REQ_BODY_LIMIT } from "./utils";
import express from "express";
import cors from "cors";
import { apiV1Router, internalRouter } from "./routes";
import { errorHandler, apiLogger, GlobalRateLimitMware } from "./middleware/";

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

app.use(GlobalRateLimitMware);

app.use(express.json({ limit: EXPRESS_REQ_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: EXPRESS_REQ_BODY_LIMIT }));

app.use(apiLogger);

app.use("/api/v1", apiV1Router);
app.use("/internal", internalRouter);

app.use(errorHandler);

export default app;
