import Router from "express";
import {
  retrieve_all_assignments,
  retrieve_assignment,
} from "../../../../controllers";
import clientSQLCodeRunRouter from "./execution";
import { compressionMware } from "../../../../middleware/";

const router = Router();

router.use("/client-sql-code-run", clientSQLCodeRunRouter);

router.get("/", compressionMware, retrieve_all_assignments);
router.get("/:id", retrieve_assignment);

export default router;
