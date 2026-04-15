import { Router } from "express";
import assignmentRouter from "./assignments/index.js";
import adminRouter from "./admin/index.js";

const router = Router();

router.use("/assignments", assignmentRouter);
router.use("/admin", adminRouter);

export default router;
