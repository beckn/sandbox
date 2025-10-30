import { Request, Response } from "express";
import axios from "axios";

export const onSelect = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onInit = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onConfirm = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onStatus = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onUpdate = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};
export const onRating = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onSupport = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  console.log(JSON.stringify({message, context}, null, 2));

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onTrack = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onCancel = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  console.log(JSON.stringify({message, context}, null, 2));
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};
