import { Router, Request, Response } from "express";

export const webhookRoutes = () => {
  const router = Router();

  router.post("/select", (req: Request, res: Response) => {
    console.log(req);
    const { context, message }: { context: any; message: any } = req.body;
    (async () => {
      switch (context.action) {
        case "select":
          console.log("select");
          break;
        case "init":
          console.log("init");
          break;
        case "confirm":
          console.log("confirm");
          break;
      }
    })();
    return res.status(200).json({ message: { ack: { status: "ACK" } } });
  });

  return router;
};
