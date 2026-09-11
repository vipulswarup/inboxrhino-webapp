export type Message = {
  id: string;
  senderName: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  preview: string;
  receivedAt: string;
  dateLabel: string;
  unread: boolean;
  contentLoaded?: boolean;
  html: string;
  text: string;
  headers: Array<[string, string]>;
  attachments: Array<{ id?: string; name: string; size: string; type: string }>;
};

export const messages: Message[] = [
  {
    id: 'msg_01k4verify',
    senderName: 'Acme',
    senderEmail: 'hello@acme.dev',
    recipient: 'cheerful-panda-x7k2@test.inboxrhino.in',
    subject: 'Verify your email address',
    preview: 'Welcome to Acme. Confirm your email address to finish setting up your account.',
    receivedAt: '10:42 AM',
    dateLabel: 'Today, 10:42 AM',
    unread: true,
    html: `<!doctype html><html><body style="margin:0;background:#f7f4ef;color:#1c1917;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:42px 20px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e7e5e4;border-radius:18px"><tr><td style="padding:36px"><div style="font-size:14px;font-weight:700;letter-spacing:.08em;color:#0f3d3e">ACME</div><h1 style="font-size:28px;line-height:1.2;margin:32px 0 14px">Verify your email address</h1><p style="font-size:16px;line-height:1.65;color:#57534e;margin:0 0 28px">Welcome to Acme. Confirm your email address to finish setting up your account.</p><a href="#" style="display:inline-block;background:#0f3d3e;color:white;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:9px">Verify email</a><p style="font-size:13px;line-height:1.5;color:#78716c;margin:30px 0 0">This link expires in 30 minutes. If you didn't create this account, you can safely ignore this email.</p></td></tr></table></td></tr></table></body></html>`,
    text: `Verify your email address\n\nWelcome to Acme. Confirm your email address to finish setting up your account.\n\nVerify email: https://acme.dev/verify/tk_demo_4fr8zk\n\nThis link expires in 30 minutes. If you didn't create this account, you can safely ignore this email.`,
    headers: [
      ['Message-ID', '<20260826051238.4fr8zk@acme.dev>'],
      ['From', 'Acme <hello@acme.dev>'],
      ['To', 'cheerful-panda-x7k2@test.inboxrhino.in'],
      ['Date', 'Wed, 26 Aug 2026 05:12:38 +0000'],
      ['Content-Type', 'multipart/alternative; boundary=acme-7d92'],
      ['X-Mailer', 'Acme Transactional/2.4'],
    ],
    attachments: [],
  },
  {
    id: 'msg_01k4invoice',
    senderName: 'Papertrail Labs',
    senderEmail: 'billing@papertrail.test',
    recipient: 'cheerful-panda-x7k2@test.inboxrhino.in',
    subject: 'Your August invoice is ready',
    preview: 'Invoice PT-2048 is attached. Thank you for your business.',
    receivedAt: '9:18 AM',
    dateLabel: 'Today, 9:18 AM',
    unread: false,
    html: `<!doctype html><html><body style="margin:0;padding:42px 20px;background:#f4f1ea;color:#1c1917;font-family:Arial,sans-serif"><main style="max-width:560px;margin:auto;background:#fff;border-radius:18px;padding:36px"><p style="font-size:13px;color:#0f3d3e;font-weight:bold">PAPERTRAIL LABS</p><h1>Invoice PT-2048</h1><p style="line-height:1.65;color:#57534e">Your August invoice is ready. The PDF is attached to this email.</p><p style="font-size:28px;font-weight:bold">₹4,720.00</p></main></body></html>`,
    text: 'Invoice PT-2048\n\nYour August invoice is ready.\nTotal: ₹4,720.00\n\nThe PDF is attached to this email.',
    headers: [
      ['Message-ID', '<invoice-2048@papertrail.test>'],
      ['From', 'Papertrail Labs <billing@papertrail.test>'],
      ['To', 'cheerful-panda-x7k2@test.inboxrhino.in'],
      ['Date', 'Wed, 26 Aug 2026 03:48:10 +0000'],
      ['Content-Type', 'multipart/mixed; boundary=pt-2048'],
    ],
    attachments: [{ name: 'invoice-PT-2048.pdf', size: '184 KB', type: 'PDF' }],
  },
  {
    id: 'msg_01k4magic',
    senderName: 'Northstar',
    senderEmail: 'auth@northstar.app',
    recipient: 'cheerful-panda-x7k2@test.inboxrhino.in',
    subject: 'Your secure sign-in link',
    preview: 'Use this magic link to sign in. It expires in 10 minutes.',
    receivedAt: 'Yesterday',
    dateLabel: 'Yesterday, 6:07 PM',
    unread: false,
    html: `<!doctype html><html><body style="margin:0;padding:42px 20px;background:#f8fafc;color:#172033;font-family:Arial,sans-serif"><main style="max-width:560px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:18px;padding:36px"><p style="font-weight:bold;color:#2563eb">NORTHSTAR</p><h1>Your secure sign-in link</h1><p style="line-height:1.65;color:#475569">Use the button below to sign in. It expires in 10 minutes.</p><a href="#" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 20px;border-radius:9px;font-weight:bold">Sign in securely</a></main></body></html>`,
    text: 'Your secure sign-in link\n\nUse this link to sign in: https://northstar.app/magic/demo\n\nIt expires in 10 minutes.',
    headers: [
      ['Message-ID', '<magic-demo@northstar.app>'],
      ['From', 'Northstar <auth@northstar.app>'],
      ['To', 'cheerful-panda-x7k2@test.inboxrhino.in'],
      ['Date', 'Tue, 25 Aug 2026 12:37:02 +0000'],
      ['Content-Type', 'multipart/alternative; boundary=northstar-42'],
    ],
    attachments: [],
  },
];

export const emailPreviewCsp =
  "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; form-action 'none'; base-uri 'none';";

export function createSafeEmailDocument(html: string) {
  const securityHead = `<meta http-equiv="Content-Security-Policy" content="${emailPreviewCsp}"><meta name="referrer" content="no-referrer">`;
  if (/<head[\s>]/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${securityHead}`);
  if (/<html[\s>]/i.test(html)) return html.replace(/<html([^>]*)>/i, `<html$1><head>${securityHead}</head>`);
  return `<!doctype html><html><head>${securityHead}</head><body>${html}</body></html>`;
}
