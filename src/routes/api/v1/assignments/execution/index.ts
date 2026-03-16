import { Router } from "express";
import {
  run_client_sql_code,
  get_job_status,
} from "../../../../../controllers";
import {
  compressionMware,
  ExecuteRateLimitMware,
} from "../../../../../middleware/";

const router = Router();

router.post(
  "/execute",
  ExecuteRateLimitMware,
  compressionMware,
  run_client_sql_code,
);
router.get("/status/:taskId", get_job_status);

export default router;
