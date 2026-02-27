import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, organization, subject, message } = body;

        // Validation
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: "Name, email, subject, and message are required." },
                { status: 400 }
            );
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Compose email
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.SMTP_TO || process.env.SMTP_USER,
            replyTo: email,
            subject: `[NADI Contact] ${subject}`,
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 32px;">
          <div style="background: #2C2C2C; padding: 24px 32px; margin: -32px -32px 32px;">
            <h1 style="font-family: Georgia, serif; color: #fff; font-size: 1.5rem; font-weight: 400; letter-spacing: 0.15em; margin: 0;">NADI</h1>
            <p style="color: #C08080; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; margin: 4px 0 0;">Contact Form Submission</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #ddd; color: #8B1C1C; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; width: 120px; vertical-align: top;">Name</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #ddd; color: #2C2C2C; font-size: 0.95rem;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #ddd; color: #8B1C1C; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">Email</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #ddd; color: #2C2C2C; font-size: 0.95rem;"><a href="mailto:${email}" style="color: #8B1C1C;">${email}</a></td>
            </tr>
            ${organization ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #ddd; color: #8B1C1C; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">Organization</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #ddd; color: #2C2C2C; font-size: 0.95rem;">${organization}</td>
            </tr>` : ""}
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #ddd; color: #8B1C1C; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">Subject</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #ddd; color: #2C2C2C; font-size: 0.95rem;">${subject}</td>
            </tr>
          </table>

          <div style="background: #fff; border-left: 3px solid #8B1C1C; padding: 20px 24px; margin-bottom: 24px;">
            <p style="color: #6B6B6B; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px;">Message</p>
            <p style="color: #2C2C2C; font-size: 0.95rem; line-height: 1.7; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="text-align: center; color: #999; font-size: 0.75rem; padding-top: 16px; border-top: 1px solid #eee;">
            <p style="margin: 0;">NADI — Network for Advancing Development & Innovation in Health</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "Email sent successfully." });
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json(
            { error: "Failed to send email. Please try again later." },
            { status: 500 }
        );
    }
}
