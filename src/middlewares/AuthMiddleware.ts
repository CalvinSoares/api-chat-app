import jwt, { VerifyErrors } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const jwtKey = process.env.JWT_KEY;

if (!jwtKey) {
  throw new Error("Jwt Key is not defined in environment variables");
}

interface JwtPayload {
  userId: string;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ message: "Token not provided" });
  jwt.verify(token, jwtKey, async (err: VerifyErrors | null, payload: any) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    const { userId } = payload as JwtPayload;

    req.userId = userId;
    next();
  });
};
