import Router from "express";
import {
  retrieve_all_assignments,
  retrieve_assignment,
} from "../../../../controllers";
import clientSQLCodeRunRouter from "./execution";
import { validateObjectId } from "../../../../middleware/";

const router = Router();

router.use("/client-sql-code-run", clientSQLCodeRunRouter);

router.get("/", retrieve_all_assignments);
router.get("/:id", validateObjectId("id"), retrieve_assignment);

export default router;
