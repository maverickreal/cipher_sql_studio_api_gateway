import { Request, Response, NextFunction } from "express";
import { auth } from "../../auth/index.js";
import { fromNodeHeaders } from "better-auth/node";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    (req as Request & { user: unknown; session: unknown }).user = session.user;
    (req as Request & { user: unknown; session: unknown }).session =
      session.session;
    next();
  } catch {
    res.status(401).json({ error: "Authentication required" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const reqWithUser = req as Request & { user?: { role?: string } };

  if (!reqWithUser.user || reqWithUser.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}
