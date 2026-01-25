import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { readDomainResponse } from "../utils";
import { catalogStore } from "../services/catalog-store";

const getCallbackUrl = (context: any, action: string): string => {
  const callbackBase = process.env.BPP_CALLBACK_ENDPOINT;
  if (callbackBase) {
    return `${callbackBase.replace(/\/$/, '')}/on_${action}`;
  }
  const full_bpp_url = new URL(context.bpp_uri);
  return `${full_bpp_url.origin}/bpp/caller/on_${action}`;
};

const getPersona = (): string | undefined => {
  return process.env.PERSONA;
};

export const onSelect = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  // on_select_response.context = { ...context, action: "on_select" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_select", getPersona());
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_select" },
      };
      const callbackUrl = getCallbackUrl(context, "select");
      console.log(
        "Triggering On Select response to:",
        callbackUrl
      );
      const select_data = await axios.post(
        callbackUrl,
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
  // on_init_response.context = { ...context, action: "on_init" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_init", getPersona());
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_init" },
      };
      const callbackUrl = getCallbackUrl(context, "init");
      console.log(
        "Triggering On Init response to:",
        callbackUrl
      );
      const init_data = await axios.post(
        callbackUrl,
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
  const ONIX_BPP_URL = process.env.ONIX_BPP_URL || 'http://onix-bpp:8082';

  (async () => {
    try {
      // Extract order items from confirm message
      const order = message?.order;
      const orderItems = order?.items || [];

      // Reduce inventory for each item and track affected catalogs
      const affectedCatalogs = new Set<string>();

      for (const orderItem of orderItems) {
        const itemId = orderItem['beckn:id'] || orderItem.id;
        const quantity = orderItem.quantity?.selected?.count ||
                        orderItem['beckn:quantity']?.['schema:value'] ||
                        orderItem.quantity || 1;

        if (itemId && quantity > 0) {
          console.log(`[Confirm] Reducing inventory: ${itemId} by ${quantity}`);

          // Get item to find its catalog
          const item = await catalogStore.getItem(itemId);
          if (item) {
            await catalogStore.reduceInventory(itemId, quantity);
            affectedCatalogs.add(item.catalogId);
            console.log(`[Confirm] Inventory reduced for ${itemId}`);
          }
        }
      }

      // Republish affected catalogs to CDS
      for (const catalogId of affectedCatalogs) {
        console.log(`[Confirm] Republishing catalog: ${catalogId}`);

        const catalog = await catalogStore.buildCatalogForPublish(catalogId);

        const publishPayload = {
          context: {
            version: "2.0.0",
            action: "catalog_publish",
            timestamp: new Date().toISOString(),
            message_id: uuidv4(),
            transaction_id: uuidv4(),
            bap_id: context.bap_id,
            bap_uri: context.bap_uri,
            bpp_id: context.bpp_id,
            bpp_uri: context.bpp_uri,
            ttl: "PT30S",
            domain: context.domain
          },
          message: {
            catalogs: [catalog]
          }
        };

        const publishUrl = `${ONIX_BPP_URL}/bpp/caller/publish`;
        const publishRes = await axios.post(publishUrl, publishPayload, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`[Confirm] Catalog republished: ${catalogId}`, publishRes.data);
      }

      // Send on_confirm response
      const template = await readDomainResponse(context.domain, "on_confirm", getPersona());
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_confirm" },
      };
      const callbackUrl = getCallbackUrl(context, "confirm");
      console.log("Triggering On Confirm response to:", callbackUrl);
      const confirm_data = await axios.post(callbackUrl, responsePayload);
      console.log("On Confirm api call response: ", confirm_data.data);

    } catch (error: any) {
      console.log("[Confirm] Error:", error.message);
    }
  })();

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onStatus = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  // on_status_response.context = { ...context, action: "on_status" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_status", getPersona());
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_status" },
      };
      const callbackUrl = getCallbackUrl(context, "status");
      console.log(
        "Triggering On Status response to:",
        callbackUrl
      );
      const status_data = await axios.post(
        callbackUrl,
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
  // on_update_response.context = { ...context, action: "on_update" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_update", getPersona());
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_update" },
      };
      const callbackUrl = getCallbackUrl(context, "update");
      console.log(
        "Triggering On Update response to:",
        callbackUrl
      );
      const update_data = await axios.post(
        callbackUrl,
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

  // on_rating_response.context = { ...context, action: "on_rating" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_rating", getPersona());
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_rating" },
      };
      const callbackUrl = getCallbackUrl(context, "rating");
      console.log(
        "Triggering On Rating response to:",
        callbackUrl
      );
      const rating_data = await axios.post(
        callbackUrl,
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
  // on_support_response.context = { ...context, action: "on_support" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_support", getPersona());
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_support" },
      };
      const callbackUrl = getCallbackUrl(context, "support");
      console.log(
        "Triggering On Support response to:",
        callbackUrl
      );
      const support_data = await axios.post(
        callbackUrl,
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
  // on_track_response.context = { ...context, action: "on_track" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_track", getPersona());
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_track" },
      };
      const callbackUrl = getCallbackUrl(context, "track");
      console.log(
        "Triggering On Track response to:",
        callbackUrl
      );
      const track_data = await axios.post(
        callbackUrl,
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
  // on_cancel_response.context = { ...context, action: "on_cancel" };
  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_cancel", getPersona());
      const responsePayload = {
        ...template,
        context: { ...context, action: "on_cancel" },
      };
      const callbackUrl = getCallbackUrl(context, "cancel");
      console.log(
        "Triggering On Cancel response to:",
        callbackUrl
      );
      const cancel_data = await axios.post(
        callbackUrl,
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

  try {
    const callbackUrl = getCallbackUrl(context, "status");
    console.log(
      "Triggering On Status response to:",
      callbackUrl
    );
    const status_data = await axios.post(
      callbackUrl,
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
  try {
    const callbackUrl = getCallbackUrl(context, "update");
    console.log(
      "Triggering On Update response to:",
      callbackUrl
    );
    const update_data = await axios.post(
      callbackUrl,
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

  try {
    const callbackUrl = getCallbackUrl(context, "cancel");
    console.log(
      "Triggering On Cancel response to:",
      callbackUrl
    );
    const cancel_data = await axios.post(
      callbackUrl,
      { context, message }
    );
    console.log("On Cancel api call response: ", cancel_data.data);
  } catch (error: any) {
    console.log(error);
  }
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};
