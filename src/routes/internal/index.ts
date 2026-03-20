import Router from "express";
import { cleanup_assignment } from "../../controllers/internal/";

const router = Router();

router.post("/cleanup/:id", cleanup_assignment);

export default router;
