import { Request, Response } from "express";
import axios from "axios";
import { readDomainResponse } from "../utils";

export const onSelect = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  // on_select_response.context = { ...context, action: "on_select" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_select");
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_select" },
      };
      console.log(
        "Triggering On Select response to:",
        `${full_bpp_url.origin}/bpp/caller/on_select`
      );
      const select_data = await axios.post(
        `${full_bpp_url.origin}/bpp/caller/on_select`,
        responsePayload
      );
      console.log("On Select api call response: ", select_data.data);
    } catch (error: any) {
      console.log(error);
    } finally {
      return;
    }
  })();
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onInit = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  // on_init_response.context = { ...context, action: "on_init" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_init");
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_init" },
      };
      console.log(
        "Triggering On Init response to:",
        `${full_bpp_url.origin}/bpp/caller/on_init`
      );
      const init_data = await axios.post(
        `${full_bpp_url.origin}/bpp/caller/on_init`,
        responsePayload
      );
      console.log("On Init api call response: ", init_data.data);
    } catch (error: any) {
      console.log(error);
    } finally {
      return;
    }
  })();
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onConfirm = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  // on_confirm_response.context = { ...context, action: "on_confirm" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_confirm");
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_confirm" },
      };
      console.log(
        "Triggering On Confirm response to:",
        `${full_bpp_url.origin}/bpp/caller/on_confirm`
      );
      const confirm_data = await axios.post(
        `${full_bpp_url.origin}/bpp/caller/on_confirm`,
        responsePayload
      );
      console.log("On Confirm api call response: ", confirm_data.data);
    } catch (error: any) {
      console.log(error);
    } finally {
      return;
    }
  })();
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onStatus = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  // on_status_response.context = { ...context, action: "on_status" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_status");
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_status" },
      };
      console.log(
        "Triggering On Status response to:",
        `${full_bpp_url.origin}/bpp/caller/on_status`
      );
      const status_data = await axios.post(
        `${full_bpp_url.origin}/bpp/caller/on_status`,
        responsePayload
      );
      console.log("On Status api call response: ", status_data.data);
    } catch (error: any) {
      console.log(error);
    } finally {
      return;
    }
  })();
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onUpdate = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  // on_update_response.context = { ...context, action: "on_update" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_update");
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_update" },
      };
      console.log(
        "Triggering On Update response to:",
        `${full_bpp_url.origin}/bpp/caller/on_update`
      );
      const update_data = await axios.post(
        `${full_bpp_url.origin}/bpp/caller/on_update`,
        responsePayload
      );
      console.log("On Update api call response: ", update_data.data);
    } catch (error: any) {
      console.log(error);
    } finally {
      return;
    }
  })();
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onRating = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  const full_bpp_url = new URL(context.bpp_uri);
  // on_rating_response.context = { ...context, action: "on_rating" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_rating");
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_rating" },
      };
      console.log(
        "Triggering On Rating response to:",
        `${full_bpp_url.origin}/bpp/caller/on_rating`
      );
      const rating_data = await axios.post(
        `${full_bpp_url.origin}/bpp/caller/on_rating`,
        responsePayload
      );
      console.log("On Rating api call response: ", rating_data.data);
    } catch (error: any) {
      console.log(error);
    } finally {
      return;
    }
  })();
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onSupport = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  // on_support_response.context = { ...context, action: "on_support" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_support");
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_support" },
      };
      console.log(
        "Triggering On Support response to:",
        `${full_bpp_url.origin}/bpp/caller/on_support`
      );
      const support_data = await axios.post(
        `${full_bpp_url.origin}/bpp/caller/on_support`,
        responsePayload
      );
      console.log("On Support api call response: ", support_data.data);
    } catch (error: any) {
      console.log(error);
    } finally {
      return;
    }
  })();
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onTrack = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  // on_track_response.context = { ...context, action: "on_track" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_track");
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_track" },
      };
      console.log(
        "Triggering On Track response to:",
        `${full_bpp_url.origin}/bpp/caller/on_track`
      );
      const track_data = await axios.post(
        `${full_bpp_url.origin}/bpp/caller/on_track`,
        responsePayload
      );
      console.log("On Track api call response: ", track_data.data);
    } catch (error: any) {
      console.log(error);
    } finally {
      return;
    }
  })();
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onCancel = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  // on_cancel_response.context = { ...context, action: "on_cancel" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_cancel");
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_cancel" },
      };
      console.log(
        "Triggering On Cancel response to:",
        `${full_bpp_url.origin}/bpp/caller/on_cancel`
      );
      const cancel_data = await axios.post(
        `${full_bpp_url.origin}/bpp/caller/on_cancel`,
        responsePayload
      );
      console.log("On Cancel api call response: ", cancel_data.data);
    } catch (error: any) {
      console.log(error);
    } finally {
      return;
    }
  })();
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const triggerOnStatus = async (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);

  try {
    console.log(
      "Triggering On Status response to:",
      `${full_bpp_url.origin}/bpp/caller/on_status`
    );
    const status_data = await axios.post(
      `${full_bpp_url.origin}/bpp/caller/on_status`,
      { context, message }
    );
    console.log("On Status api call response: ", status_data.data);
  } catch (error: any) {
    console.log(error);
  }

  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const triggerOnUpdate = async (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  try {
    console.log(
      "Triggering On Update response to:",
      `${full_bpp_url.origin}/bpp/caller/on_update`
    );
    const update_data = await axios.post(
      `${full_bpp_url.origin}/bpp/caller/on_update`,
      { context, message }
    );
    console.log("On Update api call response: ", update_data.data);
  } catch (error: any) {
    console.log(error);
  }
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const triggerOnCancel = async (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);

  try {
    console.log(
      "Triggering On Cancel response to:",
      `${full_bpp_url.origin}/bpp/caller/on_cancel`
    );
    const cancel_data = await axios.post(
      `${full_bpp_url.origin}/bpp/caller/on_cancel`,
      { context, message }
    );
    console.log("On Cancel api call response: ", cancel_data.data);
  } catch (error: any) {
    console.log(error);
  }
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};
