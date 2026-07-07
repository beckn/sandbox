import { Request, Response } from "express";
import axios from "axios";

const buildAck = (context: any) => {
  return { message: { status: "ACK", messageId: context?.messageId ?? context?.message_id ?? "" } };
};

export const onSelect = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json(buildAck(context));
};

export const onDiscover = (req: Request, res: Response) => {
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
