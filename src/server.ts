import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT"],
  credentials: true,
}));

app.use(compression({
  level: 6,
  threshold: 1024,
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.listen(process.env.SERVER_PORT, () => {
  console.log(`CipherSqlStudio service begun on port ${process.env.SERVER_PORT}.`);
}).on("error", (err: Error) => {
  console.error("Failed to start server:", err);
  process.exit(process.env.SERVER_START_FAILURE_EXIT_CODE);
});
