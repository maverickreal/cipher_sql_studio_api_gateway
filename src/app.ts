import helmet from "helmet";
import { envVars } from "./config/index.js";
import { CORS_ALLOWED_METHODS, EXPRESS_REQ_BODY_LIMIT } from "./utils/index.js";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/index.js";
import { apiV1Router, internalRouter } from "./routes/index.js";
import { errorHandler, apiLogger, GlobalRateLimitMware } from "./middleware/index.js";

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

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: EXPRESS_REQ_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: EXPRESS_REQ_BODY_LIMIT }));

app.use(apiLogger);

app.use("/api/v1", apiV1Router);
app.use("/internal", internalRouter);

app.use(errorHandler);

export default app;
