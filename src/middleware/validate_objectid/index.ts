import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

const reqParamObjIdValidMwareProvider =
  (reqParamTag: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!Types.ObjectId.isValid(`${req.params[reqParamTag]}`)) {
      res.status(400).json({ error: "The provided assignmentId is invalid!" });
    } else {
      next();
    }
  };

export default reqParamObjIdValidMwareProvider;
