import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { readDomainResponse } from "../utils";
import { catalogStore } from "../services/catalog-store";

const WHEELING_RATE = parseFloat(process.env.WHEELING_RATE || '1.50'); // INR/kWh

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

  (async () => {
    try {
      // Support both formats: message.items (spec) and message.order.beckn:orderItems (actual usage)
      const selectedItems = message?.items || message?.order?.['beckn:orderItems'] || [];
      const orderItems: any[] = [];
      let provider: string | null = null;

      // Extract buyer from request (required in response)
      const buyer = message?.order?.['beckn:buyer'];

      console.log(`[Select] Processing ${selectedItems.length} items`);

      for (const selectedItem of selectedItems) {
        // Support both beckn:id and beckn:orderedItem for item ID
        const itemId = selectedItem['beckn:id'] || selectedItem['beckn:orderedItem'];
        const requestedQty = selectedItem['beckn:quantity']?.unitQuantity || 0;

        // Fetch actual item from MongoDB
        const item = await catalogStore.getItem(itemId);
        if (!item) {
          console.log(`[Select] Item not found: ${itemId}`);
          continue;
        }

        // Check availability
        const availableQty = item['beckn:itemAttributes']?.availableQuantity || 0;
        if (requestedQty > availableQty) {
          console.log(`[Select] Warning: Insufficient qty for ${itemId}: requested ${requestedQty}, available ${availableQty}`);
        }

        // Fetch ALL offers for this item
        const offers = await catalogStore.getOffersByItemId(itemId);
        if (!offers || offers.length === 0) {
          console.log(`[Select] No offers found for item: ${itemId}`);
          continue;
        }

        // Get provider from first offer (or from item)
        if (!provider) {
          provider = offers[0]['beckn:provider'] || item['beckn:provider'];
        }

        // Clean offers for response (remove MongoDB fields)
        const cleanOffers = offers.map((offer: any) => {
          const { _id, catalogId, updatedAt, ...cleanOffer } = offer;
          return cleanOffer;
        });

        orderItems.push({
          "beckn:orderedItem": itemId,
          "beckn:quantity": {
            "unitQuantity": requestedQty,
            "unitText": "kWh"
          },
          "beckn:availableOffers": cleanOffers
        });

        console.log(`[Select] Item ${itemId}: ${cleanOffers.length} offer(s) available`);
      }

      const responsePayload = {
        context: { ...context, action: "on_select" },
        message: {
          order: {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
            "@type": "beckn:Order",
            "beckn:orderStatus": "CREATED",
            "beckn:seller": provider,
            "beckn:buyer": buyer,
            "beckn:orderItems": orderItems
          }
        }
      };

      const callbackUrl = getCallbackUrl(context, "select");
      console.log(`[Select] Sending order with ${orderItems.length} item(s) to:`, callbackUrl);
      const select_data = await axios.post(callbackUrl, responsePayload);
      console.log("[Select] Response sent successfully:", select_data.data);
    } catch (error: any) {
      console.log("[Select] Error:", error.message);
    }
  })();

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onInit = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  (async () => {
    try {
      const order = message?.order;
      const orderItems = order?.['beckn:orderItems'] || [];
      const buyer = order?.['beckn:buyer'];
      const seller = order?.['beckn:seller'];
      const orderAttributes = order?.['beckn:orderAttributes'];

      console.log(`[Init] Processing ${orderItems.length} order items`);

      // Calculate totals from all items
      let totalQuantity = 0;
      let totalEnergyCost = 0;
      let currency = 'INR';

      orderItems.forEach((item: any) => {
        const quantity = item['beckn:quantity']?.unitQuantity || 0;
        const acceptedOffer = item['beckn:acceptedOffer'];

        // Support both price formats:
        // 1. beckn:offerAttributes.beckn:price.value (template format)
        // 2. beckn:price.schema:price (real offer from on_select)
        const pricePerUnit =
          acceptedOffer?.['beckn:offerAttributes']?.['beckn:price']?.value ||
          acceptedOffer?.['beckn:price']?.['schema:price'] ||
          acceptedOffer?.['beckn:price']?.value ||
          0;

        currency =
          acceptedOffer?.['beckn:offerAttributes']?.['beckn:price']?.currency ||
          acceptedOffer?.['beckn:price']?.['schema:priceCurrency'] ||
          acceptedOffer?.['beckn:price']?.currency ||
          'INR';

        totalQuantity += quantity;
        totalEnergyCost += quantity * pricePerUnit;

        console.log(`[Init] Item ${item['beckn:orderedItem']}: ${quantity} kWh @ ${currency} ${pricePerUnit}/kWh`);
      });

      // Calculate wheeling charges
      const wheelingCharges = totalQuantity * WHEELING_RATE;
      const totalOrderValue = totalEnergyCost + wheelingCharges;

      console.log(`[Init] Total: ${totalQuantity} kWh, Energy: ${currency} ${totalEnergyCost.toFixed(2)}, Wheeling: ${currency} ${wheelingCharges.toFixed(2)}, Total: ${currency} ${totalOrderValue.toFixed(2)}`);

      // Build response per P2P Trading implementation guide
      const responsePayload = {
        context: { ...context, action: "on_init" },
        message: {
          order: {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
            "@type": "beckn:Order",
            "beckn:orderStatus": "CREATED",
            "beckn:seller": seller,
            "beckn:buyer": buyer,
            "beckn:orderAttributes": {
              "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/p2p-trading/schema/EnergyTradeOrder/v0.2/context.jsonld",
              "@type": orderAttributes?.['@type'] || "EnergyTradeOrder",
              "bap_id": context.bap_id,
              "bpp_id": context.bpp_id,
              "total_quantity": totalQuantity,
              // Preserve inter-utility fields if present
              ...(orderAttributes?.utilityIdBuyer && { "utilityIdBuyer": orderAttributes.utilityIdBuyer }),
              ...(orderAttributes?.utilityIdSeller && { "utilityIdSeller": orderAttributes.utilityIdSeller })
            },
            "beckn:orderItems": orderItems, // Passthrough with accepted offers
            "beckn:orderValue": {
              "value": totalOrderValue,
              "currency": currency,
              "components": [
                {
                  "type": "UNIT",
                  "description": "Energy Cost",
                  "value": totalEnergyCost,
                  "currency": currency
                },
                {
                  "type": "FEE",
                  "description": "Wheeling Charges",
                  "value": wheelingCharges,
                  "currency": currency
                }
              ]
            },
            "beckn:fulfillment": {
              "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
              "@type": "beckn:Fulfillment",
              "beckn:id": `fulfillment-${context.transaction_id || 'energy-001'}`,
              "beckn:mode": "DELIVERY"
            }
          }
        }
      };

      const callbackUrl = getCallbackUrl(context, "init");
      console.log("[Init] Sending on_init to:", callbackUrl);
      const init_data = await axios.post(callbackUrl, responsePayload);
      console.log("[Init] Response sent:", init_data.data);

    } catch (error: any) {
      console.log("[Init] Error:", error.message);
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
      const orderItems = order?.['beckn:orderItems'] || order?.items || [];

      console.log(`[Confirm] Processing ${orderItems.length} order items`);

      // Reduce inventory for each item and track affected catalogs
      const affectedCatalogs = new Set<string>();

      for (const orderItem of orderItems) {
        const itemId = orderItem['beckn:orderedItem'] || orderItem['beckn:id'] || orderItem.id;
        const quantity = orderItem['beckn:quantity']?.unitQuantity ||
                        orderItem.quantity?.selected?.count ||
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

      // Send on_confirm response with ACTUAL order data (not template)
      // This ensures the ledger receives correct buyer/seller/quantity info
      const responsePayload = {
        context: { ...context, action: "on_confirm" },
        message: {
          order: {
            ...order,
            "beckn:orderStatus": "CONFIRMED",
            "beckn:id": order?.['beckn:id'] || `order-${uuidv4()}`,
          }
        }
      };
      const callbackUrl = getCallbackUrl(context, "confirm");
      console.log("Triggering On Confirm response to:", callbackUrl);
      console.log("[Confirm] Sending actual order data:", JSON.stringify(responsePayload.message.order, null, 2));
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
