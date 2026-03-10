import Router from "express";
import {
  retrieve_all_assignments,
  retrieve_assignment,
} from "../../../../controllers";
import clientSQLCodeRunRouter from "./execution";
import { compression_mware } from "../../../../middleware";


const router = Router();

router.use("/client-sql-code-run", clientSQLCodeRunRouter);

router.get("/", compression_mware, retrieve_all_assignments);
router.get("/:id", retrieve_assignment);

export default router;
