import { Request, Response, NextFunction, RequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import express from "express";
import config from "../config/config";
import logger from "../config/logger";

export const securityMiddleware: RequestHandler[] = [
  helmet(),
  cors({ origin: config.corsOrigin }),
  express.json(),
];

export const rateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
}) as RequestHandler;

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  if (!config.apiKey) return next();
  const key = req.headers["x-api-key"];
  if (key !== config.apiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  logger.info({ method: req.method, path: req.path });
  next();
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error("Unhandled error", { error: err.message });
  res.status(500).json({ error: "Internal server error" });
}
