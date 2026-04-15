import Router from "express";
import {
  retrieve_all_assignments,
  retrieve_assignment,
} from "../../../../controllers/index.js";
import clientSQLCodeRunRouter from "./execution/index.js";
import { compressionMware, requireAuth } from "../../../../middleware/index.js";

const router = Router();

router.use("/client-sql-code-run", clientSQLCodeRunRouter);

router.get("/", compressionMware, retrieve_all_assignments);
router.get("/:id", requireAuth, retrieve_assignment);

export default router;
