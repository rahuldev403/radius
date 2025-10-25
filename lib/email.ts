/**
 * Email Service Utility
 * 
 * This module provides email sending functionality using Resend API
 * For development: Uses console logging
 * For production: Configure RESEND_API_KEY in .env.local
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, from = "Radius <noreply@yourdomain.com>" } = options;

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === "development";
  const resendApiKey = process.env.RESEND_API_KEY;

  if (isDevelopment || !resendApiKey) {
    // Development mode - log to console
    console.log("📧 EMAIL SENT (Development Mode):");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("From:", from);
    console.log("HTML:", html);
    console.log("---");
    return true;
  }

  try {
    // Production mode - use Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Email send failed:", error);
      return false;
    }

    const data = await response.json();
    console.log("✅ Email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

// Email Templates
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
          
          <p>You can manage your booking and chat with the provider from your dashboard.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/my-bookings" class="button">
            View My Bookings
          </a>
          
          <p>See you soon! 👋</p>
          
          <div class="footer">
            <p>This is an automated message from Radius</p>
            <p>If you have any questions, please contact us</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  bookingReminder: (data: {
    userName: string;
    providerName: string;
    serviceName: string;
    startTime: string;
    timeUntil: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fef3c7; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert { background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #78716c; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Upcoming Session Reminder</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.userName}</strong>,</p>
          <p>This is a friendly reminder about your upcoming session:</p>
          
          <div class="alert">
            <h3>📅 ${data.serviceName}</h3>
            <p><strong>With:</strong> ${data.providerName}</p>
            <p><strong>Starting in:</strong> ${data.timeUntil}</p>
            <p><strong>Time:</strong> ${data.startTime}</p>
          </div>
          
          <p>Make sure you're ready and have everything you need for the session.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/my-bookings" class="button">
            View Booking Details
          </a>
          
          <div class="footer">
            <p>This is an automated reminder from Radius</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  sessionStarting: (data: {
    userName: string;
    serviceName: string;
    bookingId: number;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #eff6ff; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 18px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Your Session is Starting Now!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.userName}</strong>,</p>
          <p>Your session "<strong>${data.serviceName}</strong>" is starting now!</p>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bookings/${data.bookingId}" class="button">
              Join Session Now 🎥
            </a>
          </p>
          
          <p>Click the button above to access the chat and video call features.</p>
          
          <div class="footer">
            <p>This is an automated notification from Radius</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
};
