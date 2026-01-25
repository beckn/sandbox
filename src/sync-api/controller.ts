import { Request, Response } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createPendingTransaction, getPendingCount, cancelPendingTransaction } from '../services/transaction-store';

const ONIX_BAP_URL = process.env.ONIX_BAP_URL || 'http://onix-bap:8081';

async function executeAndWait(action: string, becknRequest: any, transactionId: string): Promise<any> {
  const callbackPromise = createPendingTransaction(transactionId, action);

  const onixUrl = `${ONIX_BAP_URL}/bap/caller/${action}`;
  console.log(`[SyncAPI] Forwarding ${action} to ${onixUrl}, txn: ${transactionId}`);

  try {
    const ackResponse = await axios.post(onixUrl, becknRequest, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (ackResponse.data?.message?.ack?.status !== 'ACK') {
      cancelPendingTransaction(transactionId);
      throw new Error(`ONIX returned NACK: ${JSON.stringify(ackResponse.data)}`);
    }

    console.log(`[SyncAPI] Received ACK, waiting for on_${action} callback...`);
    return await callbackPromise;
  } catch (error) {
    // Cancel pending transaction to prevent orphaned timeout from crashing the process
    cancelPendingTransaction(transactionId);
    throw error;
  }
}

export async function syncSelect(req: Request, res: Response) {
  try {
    const transactionId = req.body.context?.transaction_id || uuidv4();

    const becknRequest = {
      ...req.body,
      context: { ...req.body.context, transaction_id: transactionId }
    };

    const response = await executeAndWait('select', becknRequest, transactionId);

    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
      ...response
    });
  } catch (error: any) {
    console.error(`[SyncAPI] syncSelect error:`, error.message);
    return res.status(error.message?.includes('Timeout') ? 504 : 500).json({
      success: false,
      error: error.message
    });
  }
}

export async function syncInit(req: Request, res: Response) {
  try {
    const transactionId = req.body.context?.transaction_id || uuidv4();

    const becknRequest = {
      ...req.body,
      context: { ...req.body.context, transaction_id: transactionId }
    };

    const response = await executeAndWait('init', becknRequest, transactionId);

    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
      ...response
    });
  } catch (error: any) {
    console.error(`[SyncAPI] syncInit error:`, error.message);
    return res.status(error.message?.includes('Timeout') ? 504 : 500).json({
      success: false,
      error: error.message
    });
  }
}

export async function syncConfirm(req: Request, res: Response) {
  try {
    const transactionId = req.body.context?.transaction_id || uuidv4();

    const becknRequest = {
      ...req.body,
      context: { ...req.body.context, transaction_id: transactionId }
    };

    const response = await executeAndWait('confirm', becknRequest, transactionId);

    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
      ...response
    });
  } catch (error: any) {
    console.error(`[SyncAPI] syncConfirm error:`, error.message);
    return res.status(error.message?.includes('Timeout') ? 504 : 500).json({
      success: false,
      error: error.message
    });
  }
}

export async function syncStatus(req: Request, res: Response) {
  try {
    const transactionId = req.body.context?.transaction_id || uuidv4();

    const becknRequest = {
      ...req.body,
      context: { ...req.body.context, transaction_id: transactionId }
    };

    const response = await executeAndWait('status', becknRequest, transactionId);

    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
      ...response
    });
  } catch (error: any) {
    console.error(`[SyncAPI] syncStatus error:`, error.message);
    return res.status(error.message?.includes('Timeout') ? 504 : 500).json({
      success: false,
      error: error.message
    });
  }
}

export function syncHealth(req: Request, res: Response) {
  return res.status(200).json({
    status: 'OK',
    pendingTransactions: getPendingCount(),
    onixBapUrl: ONIX_BAP_URL
  });
}
