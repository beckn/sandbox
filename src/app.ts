import express, { Router, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { webhookRoutes } from "./webhook/routes";
import { bapWebhookRoutes } from "./bap-webhook/routes";
import { tradeRoutes } from "./trade/routes";
import { syncApiRoutes } from "./sync-api/routes";
import { biddingRoutes } from "./bidding/routes";
import { connectDB } from "./db";
import { startPolling, stopPolling } from "./services/settlement-poller";

export async function createApp() {
  // Connect to MongoDB on startup
  await connectDB();

  // Start settlement polling service
  startPolling();

  const app = express();
  app.use(cors());
  app.use(helmet());
  app.use(express.json({ limit: "5mb" }));

  // Create main API router
  const apiRouter = Router();

  // Mount all routes under the main API router
  apiRouter.use("/webhook", webhookRoutes());
  apiRouter.use("/bap-webhook", bapWebhookRoutes());
  apiRouter.use("/", tradeRoutes());  // Mount at root: /api/publish, /api/inventory, etc.
  apiRouter.use("/", syncApiRoutes());  // Mounts /api/select, /api/init, etc.
  apiRouter.use("/", biddingRoutes());  // Mounts /api/bid/preview, /api/bid/confirm

  // Mount the main API router with /api prefix
  apiRouter.use("/health", (req: Request, res: Response) => {
    return res.status(200).json({ message: "OK!" });
  });
  app.use("/api", apiRouter);

  // Global error fallback
  app.use((err: any, req: any, res: any, _next: any) => {
    req?.log?.error?.(err);
    res.status(err.status || 500).json({ error: "internal_error" });
  });

  // Graceful shutdown handler
  const shutdown = () => {
    console.log('[App] Shutting down...');
    stopPolling();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}
