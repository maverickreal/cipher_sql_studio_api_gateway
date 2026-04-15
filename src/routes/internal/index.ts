import Router from "express";
import {
  cleanup_assignment,
  confirm_assignment,
} from "../../controllers/internal/index.js";
import { reqHeadIntApiKeyValidMware, validateObjectId } from "../../middleware/index.js";

const router = Router();

router.use(reqHeadIntApiKeyValidMware);

router.post("/cleanup/:id", validateObjectId("id"), cleanup_assignment);
router.patch("/confirm/:id", validateObjectId("id"), confirm_assignment);

export default router;
