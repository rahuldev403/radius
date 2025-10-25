import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Create nodemailer transporter with SMTP configuration
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

/**
 * Sends an email using SMTP via nodemailer
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: any;
}> {
  // Use SMTP_FROM from env or default
  const fromAddress =
    from || process.env.SMTP_FROM || "Radius <noreply@radius.com>";

  // In development, just log the email if SMTP is not configured
  if (process.env.NODE_ENV === "development" && !process.env.SMTP_USER) {
    console.log("📧 [DEV MODE] Email would be sent:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("From:", fromAddress);
    console.log("HTML:", html.substring(0, 200) + "...");
    return { success: true, messageId: "dev-mode" };
  }

  // Send via SMTP
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return { success: false, error };
  }
}

// OTP Email Template
export const otpEmailTemplate = (otp: string, userName: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .otp-box { background: white; border: 2px dashed #10b981; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
    .otp-code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Email Verification</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Thank you for signing up! Please use the following One-Time Password (OTP) to verify your email address:</p>
      
      <div class="otp-box">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Your verification code</p>
        <div class="otp-code">${otp}</div>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">This code expires in ${
          process.env.OTP_EXPIRY_MINUTES || 10
        } minutes</p>
      </div>

      <div class="warning">
        <p style="margin: 0; font-size: 14px;">
          <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
        </p>
      </div>

      <p>If you didn't request this verification, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Radius - Your Local Skill Network</p>
      <p style="font-size: 12px; color: #9ca3af;">This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

// Email Templates for other use cases
export const emailTemplates = {
  bookingConfirmation: (data: {
    userName: string;
    providerName: string;
    serviceName: string;
    startTime: string;
    endTime: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.userName}</strong>,</p>
          <p>Your booking has been confirmed! Here are the details:</p>
          
          <div class="details">
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Provider:</strong> ${data.providerName}</p>
            <p><strong>Start Time:</strong> ${data.startTime}</p>
            <p><strong>End Time:</strong> ${data.endTime}</p>
          </div>

          <p>You'll receive reminder notifications before your session starts.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Radius - Your Local Skill Network</p>
        </div>
      </div>
    </body>
    </html>
  `,

  sessionReminder: (data: {
    userName: string;
    serviceName: string;
    providerName: string;
    startTime: string;
    timeUntil: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Session Reminder</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.userName}</strong>,</p>
          
          <div class="alert-box">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">Your session starts ${
              data.timeUntil
            }!</p>
          </div>

          <div class="details">
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Provider:</strong> ${data.providerName}</p>
            <p><strong>Start Time:</strong> ${data.startTime}</p>
          </div>

          <p>Don't forget to prepare any materials you might need for the session.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Radius - Your Local Skill Network</p>
        </div>
      </div>
    </body>
    </html>
  `,
};
