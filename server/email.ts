import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, userName: string): Promise<void> {
  try {
    await resend.emails.send({
      from: "MemoryAmble <hello@memoryamble.com>",
      to,
      subject: `Welcome to MemoryAmble, ${userName}`,
      html: `
<div style="max-width: 560px; margin: 0 auto; font-family: Georgia, serif; color: #1a1a1a; line-height: 1.7; padding: 24px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="font-size: 24px; color: #7C3AED; margin: 0;">MemoryAmble</h1>
  </div>

  <p>Hi ${userName},</p>

  <p>Thank you for joining MemoryAmble.</p>

  <p>We built this for Jay's 84-year-old father — a sharp, funny man who started losing confidence in his memory. Not because anything was wrong. Just because forgetting a name at dinner can ruin your whole evening.</p>

  <p>We wanted to build something that felt like a warm hand on your shoulder, not a test. That's Timbuk — your memory coach. He's already impressed with you.</p>

  <p><strong>A few things to know:</strong></p>
  <p>• Sessions take about 10 minutes. That's it.<br/>
  • Cancel anytime — no questions, no hassle.<br/>
  • If anything feels off or confusing, just reply to this email. A real person reads it.</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="https://memoryamble.com/amble" style="background-color: #7C3AED; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px;">Continue Your Training</a>
  </p>

  <p>We're glad you're here.<br/>
  — The MemoryAmble Team</p>

  <p style="font-size: 13px; color: #888; margin-top: 32px; font-style: italic;">P.S. Timbuk has opinions about penguins. He'll explain.</p>
</div>
      `.trim(),
    });
  } catch (e) {
    console.error("sendWelcomeEmail failed:", e);
  }
}

function getReminderTemplate(
  userName: string,
  dayCount: number,
  streak: number
): { subject: string; bodyMessage: string } {
  if (dayCount === 6) {
    return {
      subject: `${userName}, today you graduate`,
      bodyMessage: `Seven days. You built a Memory Palace from nothing. Today is your graduation walk. I have something special waiting.`,
    };
  }

  if (streak === 0) {
    return {
      subject: `${userName}, your palace is exactly where you left it`,
      bodyMessage: `No pressure. No guilt. Just come back when you are ready. The palace does not forget — even when you do.`,
    };
  }

  const bucket = dayCount % 5;
  switch (bucket) {
    case 1:
      return {
        subject: `Your palace is waiting, ${userName}`,
        bodyMessage: `Yesterday you built something real. Let's see if it stuck. Ten minutes — I'll be here.`,
      };
    case 2:
      return {
        subject: `${userName}, your ${streak}-day streak is on the line`,
        bodyMessage: `I know life gets busy. But your palace does not build itself. Ten minutes. That is all I ask.`,
      };
    case 3:
      return {
        subject: `Quick question, ${userName}`,
        bodyMessage: `Do you remember what was at your front door yesterday? Only one way to find out.`,
      };
    case 4:
      return {
        subject: `${userName}, Timbuk is ready when you are`,
        bodyMessage: `Your palace has ${streak} days of memories in it now. Each day it gets a little stronger. So do you.`,
      };
    default:
      return {
        subject: `Ten minutes, ${userName}. That is all.`,
        bodyMessage: `You have walked your palace ${streak} times now. It is yours. But it misses you when you skip a day. So do I.`,
      };
  }
}

export async function sendReminderEmail(
  to: string,
  userName: string,
  dayCount: number,
  streak: number
): Promise<void> {
  try {
    const { subject, bodyMessage } = getReminderTemplate(userName, dayCount, streak);

    const html = `
<div style="max-width: 560px; margin: 0 auto; font-family: Georgia, serif; color: #1a1a1a; line-height: 1.7; padding: 24px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="font-size: 24px; color: #7C3AED; margin: 0;">MemoryAmble</h1>
  </div>

  <p>${userName},</p>

  <p>${bodyMessage}</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="https://memoryamble.com/amble" style="background-color: #7C3AED; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px;">Start Today's Walk</a>
  </p>

  <p style="font-size: 14px; color: #666;">— Timbuk 🧙</p>

  <p style="font-size: 11px; color: #aaa; margin-top: 32px;">You're receiving this because you signed up for MemoryAmble. <a href="https://memoryamble.com" style="color: #aaa;">Unsubscribe</a></p>
</div>
    `.trim();

    await resend.emails.send({
      from: "Timbuk at MemoryAmble <timbuk@memoryamble.com>",
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error("sendReminderEmail failed:", e);
  }
}
