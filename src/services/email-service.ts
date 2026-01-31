import nodemailer from 'nodemailer';

export const emailService = {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      let transporter;

      // Check for SMTP config
      if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Use Ethereal Test Account (Dev Mode)
        console.log(`[EmailService] SMTP not configured. Generating Ethereal test account...`);
        const testAccount = await nodemailer.createTestAccount();
        
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Sandbox" <no-reply@example.com>',
        to,
        subject,
        html: body,
      });

      console.log(`[EmailService] Email sent: ${info.messageId}`);
      
      // Log Preview URL if using Ethereal
      if (!process.env.SMTP_HOST) {
        console.log(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return false; // Return false on failure
    }
  }
};
