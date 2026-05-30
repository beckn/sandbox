import { Request, Response } from "express";
import axios from "axios";

const buildAck = (context: any) => {
  const version: string = context?.version ?? "";
  if (version.startsWith("2.")) {
    return { message: { status: "ACK", messageId: context?.messageId ?? context?.message_id ?? "" } };
  }
  return { message: { ack: { status: "ACK" } } };
};

export const onSelect = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json(buildAck(context));
};

export const onInit = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json(buildAck(context));
};

export const onConfirm = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json(buildAck(context));
};

export const onStatus = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json(buildAck(context));
};

export const onUpdate = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json(buildAck(context));
};
export const onRating = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json(buildAck(context));
};

export const onRate = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json(buildAck(context));
};

export const onSupport = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json(buildAck(context));
};

export const onTrack = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json(buildAck(context));
};

export const onCancel = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json(buildAck(context));
};
