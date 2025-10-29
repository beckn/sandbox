import { Request, Response } from "express";
import axios from "axios";
import on_select_response from "./jsons/beckn.one:energy:ev-charging/response/on_select.json";
import on_init_response from "./jsons/beckn.one:energy:ev-charging/response/on_init.json";
import on_confirm_response from "./jsons/beckn.one:energy:ev-charging/response/on_confirm.json";
import on_status_response from "./jsons/beckn.one:energy:ev-charging/response/on_status.json";
import on_track_response from "./jsons/beckn.one:energy:ev-charging/response/on_track.json";
import on_cancel_response from "./jsons/beckn.one:energy:ev-charging/response/on_cancel.json";
import on_update_response from "./jsons/beckn.one:energy:ev-charging/response/on_update.json";
import on_rating_response from "./jsons/beckn.one:energy:ev-charging/response/on_rating.json";
import on_support_response from "./jsons/beckn.one:energy:ev-charging/response/on_support.json";

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
          on_select_response.context = {...context, action: "on_select"};
          const select_data = await axios.post(
            `http://localhost:8081/bpp/caller/on_select`,
            on_select_response
          );
          console.log(select_data.data);
          break;
        case "init":
          on_init_response.context = {...context, action: "on_init"};
          const init_data = await axios.post(
            `http://localhost:8081/bpp/caller/on_init`,
            on_init_response
          );
          break;
        case "confirm":
          on_confirm_response.context = {...context, action: "on_confirm"};
          const confirm_data = await axios.post(
            `http://localhost:8081/bpp/caller/on_confirm`,
            on_confirm_response
          );
          break;
        case "status":
          on_status_response.context = {...context, action: "on_status"};
          const status_data = await axios.post(
            `http://localhost:8081/bpp/caller/on_status`,
            on_status_response
          );
          break;
        case "track":
          on_track_response.context = {...context, action: "on_track"};
          const track_data = await axios.post(
            `http://localhost:8081/bpp/caller/on_track`,
            on_track_response
          );
          break;
        case "cancel":
          on_cancel_response.context = {...context, action: "on_cancel"};
          const cancel_data = await axios.post(
            `http://localhost:8081/bpp/caller/on_cancel`,
            on_cancel_response
          );
          break;
        case "update":
          on_update_response.context = {...context, action: "on_update"};
          const update_data = await axios.post(
            `http://localhost:8081/bpp/caller/on_update`,
            on_update_response
          );
          break;
        case "rating":
          on_rating_response.context = {...context, action: "on_rating"};
          const rating_data = await axios.post(
            `http://localhost:8081/bpp/caller/on_rating`,
            on_rating_response
          );
          break;
        case "support":
          on_support_response.context = {...context, action: "on_support"};
          const support_data = await axios.post(
            `http://localhost:8081/bpp/caller/on_support`,
            on_support_response
          );
          break;
      }
    } catch (error: any) {
      console.log(error.message);
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};
