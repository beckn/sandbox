import { Request, Response } from "express";
import axios from "axios";
import { resolvePendingTransaction, hasPendingTransaction } from "../services/transaction-store";

export const onSelect = (req: Request, res: Response) => {
  const { context, message, error }: { context: any; message: any; error?: any } = req.body;
  const transactionId = context?.transaction_id;

  console.log(`[BAP Webhook] on_select received, txn: ${transactionId}`);
  if (error) {
    console.log(`[BAP Webhook] on_select ERROR:`, JSON.stringify(error, null, 2));
  } else {
    console.log(JSON.stringify({message, context}, null, 2));
  }

  // Resolve pending sync transaction if exists (include error if present)
  if (transactionId && hasPendingTransaction(transactionId)) {
    resolvePendingTransaction(transactionId, { context, message, error });
    console.log(`[BAP Webhook] Resolved pending transaction: ${transactionId}`);
  }

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onInit = (req: Request, res: Response) => {
  const { context, message, error }: { context: any; message: any; error?: any } = req.body;
  const transactionId = context?.transaction_id;

  console.log(`[BAP Webhook] on_init received, txn: ${transactionId}`);
  if (error) {
    console.log(`[BAP Webhook] on_init ERROR:`, JSON.stringify(error, null, 2));
  } else {
    console.log(JSON.stringify({message, context}, null, 2));
  }

  // Resolve pending sync transaction if exists (include error if present)
  if (transactionId && hasPendingTransaction(transactionId)) {
    resolvePendingTransaction(transactionId, { context, message, error });
    console.log(`[BAP Webhook] Resolved pending transaction: ${transactionId}`);
  }

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onConfirm = (req: Request, res: Response) => {
  const { context, message, error }: { context: any; message: any; error?: any } = req.body;
  const transactionId = context?.transaction_id;

  console.log(`[BAP Webhook] on_confirm received, txn: ${transactionId}`);
  if (error) {
    console.log(`[BAP Webhook] on_confirm ERROR:`, JSON.stringify(error, null, 2));
  } else {
    console.log(JSON.stringify({message, context}, null, 2));
  }

  // Resolve pending sync transaction if exists (include error if present)
  if (transactionId && hasPendingTransaction(transactionId)) {
    resolvePendingTransaction(transactionId, { context, message, error });
    console.log(`[BAP Webhook] Resolved pending transaction: ${transactionId}`);
  }

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onStatus = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const transactionId = context?.transaction_id;

  console.log(`[BAP Webhook] on_status received, txn: ${transactionId}`);
  console.log(JSON.stringify({message, context}, null, 2));

  // Resolve pending sync transaction if exists
  if (transactionId && hasPendingTransaction(transactionId)) {
    resolvePendingTransaction(transactionId, { context, message });
    console.log(`[BAP Webhook] Resolved pending transaction: ${transactionId}`);
  }

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onUpdate = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const transactionId = context?.transaction_id;

  console.log(`[BAP Webhook] on_update received, txn: ${transactionId}`);
  console.log(JSON.stringify({message, context}, null, 2));

  // Resolve pending sync transaction if exists
  if (transactionId && hasPendingTransaction(transactionId)) {
    resolvePendingTransaction(transactionId, { context, message });
    console.log(`[BAP Webhook] Resolved pending transaction: ${transactionId}`);
  }

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onRating = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const transactionId = context?.transaction_id;

  console.log(`[BAP Webhook] on_rating received, txn: ${transactionId}`);
  console.log(JSON.stringify({message, context}, null, 2));

  // Resolve pending sync transaction if exists
  if (transactionId && hasPendingTransaction(transactionId)) {
    resolvePendingTransaction(transactionId, { context, message });
    console.log(`[BAP Webhook] Resolved pending transaction: ${transactionId}`);
  }

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onSupport = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const transactionId = context?.transaction_id;

  console.log(`[BAP Webhook] on_support received, txn: ${transactionId}`);
  console.log(JSON.stringify({message, context}, null, 2));

  // Resolve pending sync transaction if exists
  if (transactionId && hasPendingTransaction(transactionId)) {
    resolvePendingTransaction(transactionId, { context, message });
    console.log(`[BAP Webhook] Resolved pending transaction: ${transactionId}`);
  }

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onTrack = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const transactionId = context?.transaction_id;

  console.log(`[BAP Webhook] on_track received, txn: ${transactionId}`);
  console.log(JSON.stringify({message, context}, null, 2));

  // Resolve pending sync transaction if exists
  if (transactionId && hasPendingTransaction(transactionId)) {
    resolvePendingTransaction(transactionId, { context, message });
    console.log(`[BAP Webhook] Resolved pending transaction: ${transactionId}`);
  }

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onCancel = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const transactionId = context?.transaction_id;

  console.log(`[BAP Webhook] on_cancel received, txn: ${transactionId}`);
  console.log(JSON.stringify({message, context}, null, 2));

  // Resolve pending sync transaction if exists
  if (transactionId && hasPendingTransaction(transactionId)) {
    resolvePendingTransaction(transactionId, { context, message });
    console.log(`[BAP Webhook] Resolved pending transaction: ${transactionId}`);
  }

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};
