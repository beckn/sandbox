import { PublishCommand } from "@aws-sdk/client-sns";
import { smsService, snsClient } from "./sms-service";

// Mock the SNS config module
jest.mock("./sns", () => ({
  snsClient: {
    send: jest.fn(),
  },
  aws_sns_sender_id: "TestSender",
}));

describe("SmsService", () => {
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend = snsClient.send as jest.Mock;
  });

  it("should send SMS successfully", async () => {
    mockSend.mockResolvedValue({ MessageId: "msg-123" });

    const phoneNumber = "+1234567890";
    const message = "Hello World";

    const result = await smsService.sendSms(phoneNumber, message);

    expect(result).toBe("msg-123");
    expect(mockSend).toHaveBeenCalledTimes(1);

    // Verify the command passed to send
    const command = mockSend.mock.calls[0][0] as PublishCommand;
    expect(command).toBeInstanceOf(PublishCommand);
    expect(command.input).toEqual({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        "AWS.SNS.SMS.SenderID": {
          DataType: "String",
          StringValue: "TestSender",
        },
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    });
  });

  it("should throw error if sending fails", async () => {
    const error = new Error("SNS Error");
    mockSend.mockRejectedValue(error);

    await expect(smsService.sendSms("+1234567890", "Fail")).rejects.toThrow("SNS Error");
  });
});
