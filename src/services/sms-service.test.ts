import { smsService, snsClient } from "./sms-service";

describe("SmsService", () => {
  let mockSend: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend = jest.spyOn(snsClient, "send");
  });

  afterEach(() => {
    mockSend.mockRestore();
  });

  it("should send SMS successfully", async () => {
    mockSend.mockResolvedValue({ MessageId: "msg-123" });

    const phoneNumber = "+1234567890";
    const message = "Hello World";

    const result = await smsService.sendSms(phoneNumber, message);

    expect(result).toBe("msg-123");
    expect(mockSend).toHaveBeenCalledTimes(1);

    // Verify the command passed to send
    const command = mockSend.mock.calls[0][0];
    expect(command.input).toMatchObject({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
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
