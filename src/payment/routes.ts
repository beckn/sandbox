import { Router, Request, Response } from "express";
import { paymentService } from "../services/payment-service";
import crypto from "crypto";
import { getDB } from "../db";
import { ObjectId } from "mongodb";
import { razorpay } from "../services/razorpay";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../auth/routes";

// Extend Request type to include rawBody if we capture it in app.ts
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export interface PaymentData {
  _id?: ObjectId;
  orderId: string; // Razorpay order_id
  paymentId?: string; // Razorpay payment_id
  amount: number;
  currency: string;
  receipt?: string;
  contact?: string; // Link to user,
  email?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  razorpaySignature?: string;
  webhookEvents?: any[];
  preferred_auth?: string[];
  callback_url?: string;
  transaction_id?: string;
}

export enum PaymentStatus {
  CREATED = "created",
  ATTEMPTED = "attempted",
  PAID = "paid", // successful
  FAILED = "failed",
  REFUNDED = "refunded",
}

export const paymentRoutes = () => {
  const router = Router();

  // POST /api/payment/order - Create a new payment order
  router.post("/payment/order", async (req: Request, res: Response) => {
    try {
      const {
        amount,
        currency,
        receipt,
        notes,
        userPhone,
        transactionId,
        email,
      } = req.body;
      console.log("req.body", req.body);
      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      // If user is authenticated via middleware (available in req.user), use that phone
      const phone = (req as any).user?.phone || userPhone;

      const order = await paymentService.createOrder(
        amount,
        currency,
        receipt,
        notes,
        phone,
      );
      console.log("Created Razorpay order:", order);
      const db = getDB();

      const txnBody = {
        userPhone: phone,
        status: "pending",
        amount,
        currency,
        orderId: order.id,
        transaction_id: transactionId || uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let trnsResp = await db
        .collection<PaymentData>("payments")
        .insertOne(txnBody);
      console.log("Created payment db transaction:", trnsResp);

      const paymentLink = await paymentService.createPaymentLink({
        amount: order.amount,
        currency,
        id: order.id,
        contact: phone,
        email: notes?.email || "ritik@tequity.tech",
        name: notes?.name || "Customer",
      });
      console.log("Created Razorpay payment link:", paymentLink);
      res.json({ url: paymentLink.short_url, orderId: order.id });
    } catch (error: any) {
      console.error("[API] Error creating payment order:", error);
      return res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  router.get("/payment-callback", async (req, res) => {
    const {
      razorpay_payment_id,
      razorpay_payment_link_id,
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_signature,
    } = req.query;
    console.log("Payment callback received:", req.query);

    if (
      !razorpay_payment_id ||
      !razorpay_payment_link_id ||
      !razorpay_payment_link_reference_id ||
      !razorpay_signature
    ) {
      return res.status(400).send("<h1>Invalid Payment Callback</h1>");
    }

    const isValid = await paymentService.verifyPayment(
      razorpay_payment_link_reference_id as string,
      razorpay_payment_id as string,
      razorpay_signature as string,
    );

    if (isValid) {
      res.json({ success: true, message: "Payment Successful" });
    } else {
      res.status(400).json({ success: false, error: "Verification Failed" });
    }
  });

  // GET /api/payment/:orderId - Get status
  router.get("/payment/:orderId", async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const id = Array.isArray(orderId) ? orderId[0] : orderId;
      const payment = await paymentService.getPayment(id);

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json(payment);
    } catch (error: any) {
      console.error("[API] Error fetching payment:", error);
      res.status(500).json({ error: "Failed to fetch payment details" });
    }
  });

  return router;
};
