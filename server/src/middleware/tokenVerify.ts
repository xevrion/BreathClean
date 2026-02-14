import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const tokenVerify = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET!
    ) as JwtPayload;
    req.userId = decoded.userId;
    return next();
  } catch {
    return res.status(500).json({ errorMsg: "Internal server error" });
  }
};
