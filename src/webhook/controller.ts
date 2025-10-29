import { Request, Response } from "express";
import axios from "axios";
import on_select_response from "./jsons/beckn.one:energy:ev-charging/response/on_select.json";

export const onSelect = (req: Request, res: Response) => {
  const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  console.log(fullUrl, req.get("referer"));
  const origin = req.get("origin") || req.get("referer") || "Unknown";
  console.log("Request came from:", origin);

  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
  console.log("Caller IP:", ip);
  const { context, message }: { context: any; message: any } = req.body;
  (async () => {
    try {
      switch (context.action) {
        case "select":
          on_select_response.context = context;
          console.log(context.bpp_uri);
          const data = await axios.post(
            `http://localhost:8081/bpp/caller/on_select`,
            on_select_response
          );
          console.log(data);
          break;
        case "init":
          console.log("init");
          break;
        case "confirm":
          console.log("confirm");
          break;
      }
    } catch (error: any) {
      console.log(error.message);
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};
