import { Router } from "express";
import assignmentRouter from "./assignments";

const router = Router();

router.use("/assignments", assignmentRouter);

export default router;
