import Router from "express";
import { create_assignment } from "../../../../controllers/";

const router = Router();

router.post("/assignments", create_assignment);

export default router;
