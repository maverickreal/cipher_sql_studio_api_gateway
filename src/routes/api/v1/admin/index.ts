import Router from "express";
import { create_assignment } from "../../../../controllers/index.js";
import { requireAuth, requireAdmin } from "../../../../middleware/index.js";

const router = Router();

router.post("/assignments", requireAuth, requireAdmin, create_assignment);

export default router;
