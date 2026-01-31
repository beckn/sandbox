import { Router } from "express";
import { sendSmsHandler } from "./controller";

export const notificationRoutes = () => {
  const router = Router();

  router.post("/notification/sms", sendSmsHandler);

  return router;
};
