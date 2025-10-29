import { Router, Request, Response } from "express";
import { onSelect } from "./controller";

export const webhookRoutes = () => {
  const router = Router();

  router.post("/select", onSelect);

  return router;
};
