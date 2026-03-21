import Router from "express";
import {
  cleanup_assignment,
  confirm_assignment,
} from "../../controllers/internal/";
import { reqHeadIntApiKeyValidMware, validateObjectId } from "../../middleware";

const router = Router();

router.use(reqHeadIntApiKeyValidMware);

router.post("/cleanup/:id", validateObjectId("id"), cleanup_assignment);
router.patch("/confirm/:id", validateObjectId("id"), confirm_assignment);

export default router;
