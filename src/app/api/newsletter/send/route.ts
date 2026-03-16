import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllSubscribers } from "@/lib/newsletter-store";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const { subject, content } = await req.json();

        if (!subject || !content) {
            return NextResponse.json({ error: "Subject and content are required." }, { status: 400 });
        }

        // Setup Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_PORT === "465",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Fetch all active subscribers
        const subscribers = await getAllSubscribers();
        const activeSubscribers = subscribers.filter(sub => sub.isActive);

        if (activeSubscribers.length === 0) {
            return NextResponse.json({ error: "No active subscribers found." }, { status: 400 });
        }

        // We will send in batches of 50 to avoid connection overload
        const bccList = activeSubscribers.map(sub => sub.email);
        const batchSize = 50;
        let sentCount = 0;
        let errorCount = 0;

        for (let i = 0; i < bccList.length; i += batchSize) {
            const batch = bccList.slice(i, i + batchSize);
            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || `"NADI Newsletter" <${process.env.SMTP_USER}>`,
                    to: process.env.SMTP_TO || process.env.SMTP_USER, // Self address for To
                    bcc: batch.join(","), // BCC to all subscribers
                    subject: subject,
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                            ${content.replace(/\n/g, "<br>")}
                            <hr style="margin-top: 2rem; border: none; border-top: 1px solid #ddd;">
                            <p style="font-size: 0.8rem; color: #888;">
                                You are receiving this email because you subscribed to the NADI health policy network.<br>
                                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/" style="color: #8B1C1C;">Visit our website</a>
                            </p>
                        </div>
                    `,
                });
                sentCount += batch.length;
            } catch (batchError) {
                console.error("Batch sending failed:", batchError);
                errorCount += batch.length;
            }
        }

        return NextResponse.json({
            success: true,
            sent: sentCount,
            errors: errorCount,
            message: `Newsletter sent. ${sentCount} succeeded, ${errorCount} failed.`
        });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
