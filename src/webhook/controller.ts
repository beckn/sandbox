import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { readDomainResponse } from "../utils";
import { catalogStore } from "../services/catalog-store";

const WHEELING_RATE = parseFloat(process.env.WHEELING_RATE || '1.50'); // INR/kWh

// Calculate delivery progress for on_status based on time elapsed since confirmation
// Exported for testing
export function calculateDeliveryProgress(order: any, confirmedAt: Date, now: Date) {
  // Get total quantity from order attributes or sum of order items
  const totalQuantity = order["beckn:orderAttributes"]?.total_quantity ||
    order["beckn:orderItems"]?.reduce((sum: number, item: any) =>
      sum + (item["beckn:quantity"]?.unitQuantity || 0), 0) || 10;

  // Simulate delivery over 24 hours
  const elapsedMs = now.getTime() - confirmedAt.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const deliveryDurationHours = 24;

  const progressRatio = Math.min(elapsedHours / deliveryDurationHours, 1);
  const deliveredQuantity = Math.round(totalQuantity * progressRatio * 100) / 100;
  const isComplete = progressRatio >= 1;

  // Generate meter readings per schema: beckn:timeWindow, allocatedEnergy, unit
  const readingCount = Math.min(Math.floor(elapsedHours) + 1, 6);
  const meterReadings = [];
  for (let i = 0; i < readingCount; i++) {
    const startTime = new Date(confirmedAt.getTime() + i * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const allocatedEnergy = Math.round((totalQuantity / deliveryDurationHours) * 100) / 100;
    meterReadings.push({
      "beckn:timeWindow": {
        "@type": "beckn:TimePeriod",
        "schema:startTime": startTime.toISOString(),
        "schema:endTime": endTime.toISOString()
      },
      "allocatedEnergy": allocatedEnergy,
      "producedEnergy": allocatedEnergy,
      "consumedEnergy": allocatedEnergy * 0.98, // 2% grid loss
      "unit": "kWh"
    });
  }

  return {
    isComplete,
    deliveredQuantity,
    deliveryAttributes: {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/p2p-trading/schema/EnergyTradeDelivery/v0.2/context.jsonld",
      "@type": "EnergyTradeDelivery",
      "deliveryStatus": isComplete ? "COMPLETED" : "IN_PROGRESS",
      "deliveryMode": "GRID_INJECTION",
      "deliveredQuantity": deliveredQuantity,
      "meterReadings": meterReadings,
      "lastUpdated": now.toISOString()
    }
  };
}

// Validate context has required fields for callback
// Exported for testing
export function validateContext(context: any): { valid: boolean; error?: string } {
  if (!context) return { valid: false, error: "Missing context" };
  if (!context.bpp_uri && !process.env.BPP_CALLBACK_ENDPOINT) {
    return { valid: false, error: "Missing bpp_uri and no BPP_CALLBACK_ENDPOINT configured" };
  }
  return { valid: true };
}

// Exported for testing
export const getCallbackUrl = (context: any, action: string): string => {
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

        // Check availability - REJECT if insufficient
        const availableQty = item['beckn:itemAttributes']?.availableQuantity || 0;
        if (requestedQty > availableQty) {
          console.log(`[Select] ERROR: Insufficient qty for ${itemId}: requested ${requestedQty}, available ${availableQty}`);

          // Send error response via callback
          const callbackUrl = getCallbackUrl(context, "select");
          await axios.post(callbackUrl, {
            context: {
              ...context,
              action: "on_select",
              message_id: uuidv4(),
              timestamp: new Date().toISOString()
            },
            error: {
              code: "INSUFFICIENT_INVENTORY",
              message: `Insufficient quantity for ${itemId}: requested ${requestedQty} kWh, available ${availableQty} kWh`
            }
          });
          return; // Stop processing
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
        context: {
          ...context,
          action: "on_select",
          message_id: uuidv4(),
          timestamp: new Date().toISOString()
        },
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
        context: {
          ...context,
          action: "on_init",
          message_id: uuidv4(),
          timestamp: new Date().toISOString()
        },
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

      // PRE-CHECK: Validate inventory BEFORE reducing
      for (const orderItem of orderItems) {
        const itemId = orderItem['beckn:orderedItem'] || orderItem['beckn:id'] || orderItem.id;
        const quantity = orderItem['beckn:quantity']?.unitQuantity ||
                        orderItem.quantity?.selected?.count ||
                        orderItem.quantity || 1;

        if (itemId && quantity > 0) {
          const item = await catalogStore.getItem(itemId);
          if (item) {
            const availableQty = item['beckn:itemAttributes']?.availableQuantity || 0;
            if (quantity > availableQty) {
              console.log(`[Confirm] ERROR: Insufficient inventory for ${itemId}: requested ${quantity}, available ${availableQty}`);

              // Send error callback
              const callbackUrl = getCallbackUrl(context, "confirm");
              await axios.post(callbackUrl, {
                context: {
                  ...context,
                  action: "on_confirm",
                  message_id: uuidv4(),
                  timestamp: new Date().toISOString()
                },
                error: {
                  code: "INSUFFICIENT_INVENTORY",
                  message: `Cannot confirm order: insufficient inventory for ${itemId}. Requested ${quantity} kWh, available ${availableQty} kWh`
                }
              });
              return; // Stop processing - don't confirm the order
            }
          }
        }
      }

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
      const confirmedOrder = {
        ...order,
        "beckn:orderStatus": "CONFIRMED",
        "beckn:id": order?.['beckn:id'] || `order-${uuidv4()}`,
      };

      const responsePayload = {
        context: {
          ...context,
          action: "on_confirm",
          message_id: uuidv4(),
          timestamp: new Date().toISOString()
        },
        message: {
          order: confirmedOrder
        }
      };

      // Save order to MongoDB for status tracking
      await catalogStore.saveOrder(context.transaction_id, {
        order: confirmedOrder,
        context: {
          bap_id: context.bap_id,
          bpp_id: context.bpp_id,
          domain: context.domain
        }
      });

      const callbackUrl = getCallbackUrl(context, "confirm");
      console.log("Triggering On Confirm response to:", callbackUrl);
      console.log("[Confirm] Sending actual order data:", JSON.stringify(confirmedOrder, null, 2));
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

  (async () => {
    try {
      const transactionId = context.transaction_id;
      const savedOrder = await catalogStore.getOrderByTransactionId(transactionId);

      if (!savedOrder) {
        console.log(`[Status] Order not found for txn: ${transactionId}`);
        // Return error response
        const callbackUrl = getCallbackUrl(context, "status");
        await axios.post(callbackUrl, {
          context: {
            ...context,
            action: "on_status",
            message_id: uuidv4(),
            timestamp: new Date().toISOString()
          },
          error: {
            code: "ORDER_NOT_FOUND",
            message: `No order found for transaction ${transactionId}`
          }
        });
        return;
      }

      const order = savedOrder.order;
      const confirmedAt = new Date(savedOrder.confirmedAt);
      const now = new Date();

      // Calculate delivery progress based on time elapsed
      const deliveryProgress = calculateDeliveryProgress(order, confirmedAt, now);

      console.log(`[Status] Order ${transactionId}: ${deliveryProgress.deliveredQuantity} kWh delivered, status: ${deliveryProgress.isComplete ? 'COMPLETED' : 'IN_PROGRESS'}`);

      const responsePayload = {
        context: {
          ...context,
          action: "on_status",
          message_id: uuidv4(),
          timestamp: now.toISOString()
        },
        message: {
          order: {
            ...order,
            "beckn:orderStatus": deliveryProgress.isComplete ? "COMPLETED" : "INPROGRESS",
            "beckn:fulfillment": {
              ...order["beckn:fulfillment"],
              "beckn:deliveryAttributes": deliveryProgress.deliveryAttributes
            }
          }
        }
      };

      const callbackUrl = getCallbackUrl(context, "status");
      console.log("[Status] Sending on_status to:", callbackUrl);
      const status_data = await axios.post(callbackUrl, responsePayload);
      console.log("[Status] Response sent:", status_data.data);
    } catch (error: any) {
      console.log("[Status] Error:", error.message);
    }
  })();

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onUpdate = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  // Validate context early
  const validation = validateContext(context);
  if (!validation.valid) {
    console.log(`[Update] Invalid context: ${validation.error}`);
    return res.status(200).json({
      message: { ack: { status: "NACK" } },
      error: { code: "INVALID_CONTEXT", message: validation.error }
    });
  }

  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_update", getPersona());

      // Validate template exists
      if (!template || Object.keys(template).length === 0) {
        console.log(`[Update] No template found for domain: ${context.domain}`);
        return;
      }

      const responsePayload = {
        ...template,
        context: {
          ...context,
          action: "on_update",
          message_id: uuidv4(),
          timestamp: new Date().toISOString()
        },
      };
      const callbackUrl = getCallbackUrl(context, "update");
      console.log("[Update] Triggering On Update response to:", callbackUrl);
      const update_data = await axios.post(callbackUrl, responsePayload);
      console.log("[Update] On Update api call response:", update_data.data);
    } catch (error: any) {
      console.log("[Update] Error:", error.message);
    }
  })();

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onRating = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  // Validate context early
  const validation = validateContext(context);
  if (!validation.valid) {
    console.log(`[Rating] Invalid context: ${validation.error}`);
    return res.status(200).json({
      message: { ack: { status: "NACK" } },
      error: { code: "INVALID_CONTEXT", message: validation.error }
    });
  }

  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_rating", getPersona());

      // Validate template exists
      if (!template || Object.keys(template).length === 0) {
        console.log(`[Rating] No template found for domain: ${context.domain}`);
        return;
      }

      const responsePayload = {
        ...template,
        context: {
          ...context,
          action: "on_rating",
          message_id: uuidv4(),
          timestamp: new Date().toISOString()
        },
      };
      const callbackUrl = getCallbackUrl(context, "rating");
      console.log("[Rating] Triggering On Rating response to:", callbackUrl);
      const rating_data = await axios.post(callbackUrl, responsePayload);
      console.log("[Rating] On Rating api call response:", rating_data.data);
    } catch (error: any) {
      console.log("[Rating] Error:", error.message);
    }
  })();

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onSupport = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  // Validate context early
  const validation = validateContext(context);
  if (!validation.valid) {
    console.log(`[Support] Invalid context: ${validation.error}`);
    return res.status(200).json({
      message: { ack: { status: "NACK" } },
      error: { code: "INVALID_CONTEXT", message: validation.error }
    });
  }

  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_support", getPersona());

      // Validate template exists
      if (!template || Object.keys(template).length === 0) {
        console.log(`[Support] No template found for domain: ${context.domain}`);
        return;
      }

      const responsePayload = {
        ...template,
        context: {
          ...context,
          action: "on_support",
          message_id: uuidv4(),
          timestamp: new Date().toISOString()
        },
      };
      const callbackUrl = getCallbackUrl(context, "support");
      console.log("[Support] Triggering On Support response to:", callbackUrl);
      const support_data = await axios.post(callbackUrl, responsePayload);
      console.log("[Support] On Support api call response:", support_data.data);
    } catch (error: any) {
      console.log("[Support] Error:", error.message);
    }
  })();

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onTrack = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  // Validate context early
  const validation = validateContext(context);
  if (!validation.valid) {
    console.log(`[Track] Invalid context: ${validation.error}`);
    return res.status(200).json({
      message: { ack: { status: "NACK" } },
      error: { code: "INVALID_CONTEXT", message: validation.error }
    });
  }

  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_track", getPersona());

      // Validate template exists
      if (!template || Object.keys(template).length === 0) {
        console.log(`[Track] No template found for domain: ${context.domain}`);
        return;
      }

      const responsePayload = {
        ...template,
        context: {
          ...context,
          action: "on_track",
          message_id: uuidv4(),
          timestamp: new Date().toISOString()
        },
      };
      const callbackUrl = getCallbackUrl(context, "track");
      console.log("[Track] Triggering On Track response to:", callbackUrl);
      const track_data = await axios.post(callbackUrl, responsePayload);
      console.log("[Track] On Track api call response:", track_data.data);
    } catch (error: any) {
      console.log("[Track] Error:", error.message);
    }
  })();

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onCancel = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  // Validate context early
  const validation = validateContext(context);
  if (!validation.valid) {
    console.log(`[Cancel] Invalid context: ${validation.error}`);
    return res.status(200).json({
      message: { ack: { status: "NACK" } },
      error: { code: "INVALID_CONTEXT", message: validation.error }
    });
  }

  (async () => {
    try {
      const template = await readDomainResponse(context.domain, "on_cancel", getPersona());

      // Validate template exists
      if (!template || Object.keys(template).length === 0) {
        console.log(`[Cancel] No template found for domain: ${context.domain}`);
        return;
      }

      const responsePayload = {
        ...template,
        context: {
          ...context,
          action: "on_cancel",
          message_id: uuidv4(),
          timestamp: new Date().toISOString()
        },
      };
      const callbackUrl = getCallbackUrl(context, "cancel");
      console.log("[Cancel] Triggering On Cancel response to:", callbackUrl);
      const cancel_data = await axios.post(callbackUrl, responsePayload);
      console.log("[Cancel] On Cancel api call response:", cancel_data.data);
    } catch (error: any) {
      console.log("[Cancel] Error:", error.message);
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
