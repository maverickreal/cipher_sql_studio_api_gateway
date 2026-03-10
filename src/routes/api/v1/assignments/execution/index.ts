import { Router } from "express";
import { run_client_sql_code, get_job_status } from "../../../../../controllers";
import { compression_mware } from "../../../../../middleware";


const router = Router();

router.post("/execute", compression_mware, run_client_sql_code);
router.get("/status/:taskId", get_job_status);

export default router;
