import "server-only";
import { Resend } from "resend";
import { BUSINESS, EMAIL_FROM } from "@/lib/business";
import { formatCents } from "@/lib/money";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

function wrapper(bodyHtml: string) {
  return `
  <div style="background:#040609;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:520px;margin:0 auto;background:#0a0d11;border:1px solid #25292e;padding:32px;">
      <p style="margin:0 0 24px;font-size:22px;letter-spacing:0.05em;color:#f1eee7;">
        Dat<span style="color:#d1a84b;">Photography</span>
      </p>
      ${bodyHtml}
      <p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #25292e;font-size:12px;color:#948f82;font-family:Arial,sans-serif;">
        ${BUSINESS.name} &middot; ${BUSINESS.email} &middot; ${BUSINESS.phone}
      </p>
    </div>
  </div>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#d1a84b;color:#040609;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;">${label}</a>`;
}

export async function sendQuoteEmail(opts: {
  to: string;
  clientName: string;
  quoteNumber: string;
  totalCents: number;
  introMessage: string | null;
  url: string;
}): Promise<{ error?: string }> {
  const html = wrapper(`
    <p style="font-size:16px;color:#f1eee7;">Hi ${opts.clientName},</p>
    <p style="font-size:15px;line-height:1.6;color:#c9c5bb;font-family:Arial,sans-serif;">
      Here's quote ${opts.quoteNumber} for ${formatCents(opts.totalCents)}.
      ${opts.introMessage ? "A note from the studio is included on the quote page." : ""}
    </p>
    ${button(opts.url, "View & accept quote")}
  `);

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: opts.to,
      replyTo: BUSINESS.email,
      subject: `Quote ${opts.quoteNumber} from ${BUSINESS.name}`,
      html,
    });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not send email" };
  }
}

export async function sendInvoiceEmail(opts: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  totalCents: number;
  url: string;
}): Promise<{ error?: string }> {
  const html = wrapper(`
    <p style="font-size:16px;color:#f1eee7;">Hi ${opts.clientName},</p>
    <p style="font-size:15px;line-height:1.6;color:#c9c5bb;font-family:Arial,sans-serif;">
      Here's invoice ${opts.invoiceNumber} for ${formatCents(opts.totalCents)}.
    </p>
    ${button(opts.url, `Pay ${formatCents(opts.totalCents)} now`)}
  `);

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: opts.to,
      replyTo: BUSINESS.email,
      subject: `Invoice ${opts.invoiceNumber} from ${BUSINESS.name}`,
      html,
    });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not send email" };
  }
}
