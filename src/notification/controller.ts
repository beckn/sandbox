import { Request, Response } from "express";
import { z } from "zod";
import { smsService } from "../services/sms-service";

const sendSmsSchema = z.object({
  phone: z.string().min(10, "Phone number is too short").regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format"),
  message: z.string().min(1, "Message cannot be empty"),
});

export const sendSmsHandler = async (req: Request, res: Response) => {
  const validationResult = sendSmsSchema.parse(req.body);
  try {
    const { phone, message } = validationResult;

    const messageId = await smsService.sendSms(phone, message);

    return res.status(200).json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error("[NotificationController] Error sending SMS:", error);
    return res.status(500).json({ error: "Failed to send SMS" });
  }
};
