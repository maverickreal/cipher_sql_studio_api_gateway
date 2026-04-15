import { Router } from "express";
import {
  run_client_sql_code,
  get_job_status,
} from "../../../../../controllers/index.js";
import {
  compressionMware,
  ExecuteRateLimitMware,
  requireAuth,
} from "../../../../../middleware/index.js";

const router = Router();

router.post(
  "/execute",
  requireAuth,
  ExecuteRateLimitMware,
  compressionMware,
  run_client_sql_code,
);
router.get("/status/:taskId", requireAuth, get_job_status);

export default router;
