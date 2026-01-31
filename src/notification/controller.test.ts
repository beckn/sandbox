import { Request, Response } from "express";
import { sendSmsHandler } from "./controller";
import { smsService } from "../services/sms-service";

// Mock the smsService
jest.mock("../services/sms-service", () => ({
  smsService: {
    sendSms: jest.fn(),
  },
}));

// Helper to create mock Request
const mockRequest = (body: any): Partial<Request> => ({ body });

// Helper to create mock Response
const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Notification Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendSmsHandler", () => {
    it("should return 400 if validation fails (invalid phone)", async () => {
      const req = mockRequest({ phone: "invalid-phone", message: "Test SMS" });
      const res = mockResponse();

      await sendSmsHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation failed",
        })
      );
    });

    it("should return 400 if validation fails (missing message)", async () => {
      const req = mockRequest({ phone: "+1234567890" }); // Missing message
      const res = mockResponse();

      await sendSmsHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 200 and messageId on success", async () => {
      const req = mockRequest({ phone: "+1234567890", message: "Test SMS" });
      const res = mockResponse();

      (smsService.sendSms as jest.Mock).mockResolvedValue("msg-id-123");

      await sendSmsHandler(req as Request, res as Response);

      expect(smsService.sendSms).toHaveBeenCalledWith("+1234567890", "Test SMS");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        messageId: "msg-id-123",
      });
    });

    it("should return 500 if service throws error", async () => {
      const req = mockRequest({ phone: "+1234567890", message: "Test SMS" });
      const res = mockResponse();

      (smsService.sendSms as jest.Mock).mockRejectedValue(new Error("SNS Fail"));

      await sendSmsHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to send SMS",
      });
    });
  });
});
