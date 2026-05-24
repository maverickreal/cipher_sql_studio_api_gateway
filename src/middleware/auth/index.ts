import { Request, Response, NextFunction } from "express";
import { auth } from "../../auth";
import { fromNodeHeaders } from "better-auth/node";

export const sessionMware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const headers = fromNodeHeaders(req.headers);
    const result = await auth.api.getSession({ headers });

    req.authUser = null;
    req.authSession = null;

    if (result?.user && result?.session) {
      req.authUser = result.user;
      req.authSession = result.session;
    }
  } catch {
    req.authUser = null;
    req.authSession = null;
  }

  next();
};

export const requireAuthMware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  next();
};

export const requireAdminMware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.authUser?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
};
