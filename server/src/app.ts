import express from "express";
import {
  securityMiddleware,
  rateLimiter,
  apiKeyAuth,
  requestLogger,
  errorHandler,
} from "./middleware/index";
import accountsRouter from "./Account/account.route";

const app = express();

app.use(...securityMiddleware);
app.use(rateLimiter);
app.use(apiKeyAuth);
app.use(requestLogger);

app.use("/api/accounts", accountsRouter);

app.use(errorHandler);

export default app;