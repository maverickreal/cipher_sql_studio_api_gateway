import Router from "express";
import { create_assignment } from "../../../../controllers/";
import { requireAuthMware, requireAdminMware } from "../../../../middleware/";

const router = Router();

router.use(requireAuthMware);
router.use(requireAdminMware);

router.post("/assignments", create_assignment);

export default router;
