import { Router, Request, Response } from "express";

export const webhookRoutes = () => {
  const router = Router();

  router.post("/", (req: Request, res: Response) => {
    return res.status(200).json({ message: "Hello World" });
  });

  return router;
};
