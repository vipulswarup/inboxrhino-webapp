export const SITE_ORIGIN = 'https://inboxrhino.in';
export const APP_ORIGIN = 'https://app.inboxrhino.in';
export const API_ORIGIN = 'https://api.inboxrhino.in';
export const FILES_ORIGIN = 'https://files.inboxrhino.in';
export const CONTACT_EMAIL = 'contact@inboxrhino.in';
export const LEGAL_NAME = 'Argali Knowledge Services Pvt Ltd';
export const ARGALI_ORIGIN = 'https://argali.in';
export const OG_IMAGE_PATH = '/brand/og-default.png';
export const OG_IMAGE_ALT = 'InboxRhino receive-only test email inboxes';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OFFICE_ADDRESS = {
  streetAddress: '4th Floor, Statesman House, Barakhamba Road',
  addressLocality: 'New Delhi',
  postalCode: '110001',
  addressCountry: 'IN',
} as const;
export const OFFICE_PHONE = '+91 74282 42192';

export const homeFaqs = [
  {
    q: 'Can test inboxes send mail?',
    a: 'No. Inboxes are receive-only. InboxRhino cannot send, reply, or forward as a generated address.',
  },
  {
    q: 'How long are messages kept?',
    a: '30 days. After that, message content, headers, and attachments are deleted. The inbox itself stays until you delete it.',
  },
  {
    q: 'What is the free tier?',
    a: '11 active inboxes, 33 inbound emails per UTC calendar month, and one organisation user. Enough to wire one flow on your laptop.',
  },
  {
    q: 'When can I pay in INR?',
    a: 'Paid Starter, Growth, and Scale plans are designed with INR prices and GST. Checkout is coming soon. The free tier is live now.',
  },
] as const;
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-JWMSV0FTTY';
export const AHREFS_ANALYTICS_KEY = process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY || '2k1nGNd6PVGmi9GCM8VKtg';

export function isPublicAnalyticsHost(hostname: string) {
  return hostname === 'inboxrhino.in' || hostname === 'www.inboxrhino.in' || hostname === 'app.inboxrhino.in';
}

export const OPENAPI_PATH = '/openapi.yaml';
export const POSTMAN_COLLECTION_PATH = '/postman/InboxRhino.postman_collection.json';

export function hostnameOf(hostHeader: string | null) {
  return (hostHeader ?? '').split(':')[0].toLowerCase();
}

export function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function isConsoleHost(hostHeader: string | null) {
  const hostname = hostnameOf(hostHeader);
  return hostname === 'app.inboxrhino.in' || hostname.endsWith('.chatgpt.site');
}

export function consoleHref(hostHeader: string | null, path: string) {
  if (isLocalHost(hostnameOf(hostHeader))) return path;
  return `${APP_ORIGIN}${path}`;
}

export const waitSnippet = `const key = process.env.INBOXRHINO_API_KEY;

const created = await fetch('${API_ORIGIN}/v1/inboxes', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${key}\`, 'Content-Type': 'application/json' },
}).then((r) => r.json());

const mail = await fetch(
  \`${API_ORIGIN}/v1/inboxes/\${created.data.id}/messages?wait_seconds=180&limit=1&include=content&subject=Verify\`,
  { headers: { Authorization: \`Bearer \${key}\` } },
).then((r) => r.json());

console.log(mail.data[0].subject);`;

export const plans = [
  {
    name: 'Free',
    price: '₹0',
    annual: null as string | null,
    inboxes: 11,
    emails: 33,
    users: 1,
    live: true,
  },
  {
    name: 'Starter',
    price: '₹199',
    annual: '₹2,149',
    inboxes: 1100,
    emails: 3300,
    users: 3,
    live: false,
  },
  {
    name: 'Growth',
    price: '₹999',
    annual: '₹10,789',
    inboxes: 6600,
    emails: 22000,
    users: 10,
    live: false,
  },
  {
    name: 'Scale',
    price: '₹2,499',
    annual: '₹26,989',
    inboxes: 16500,
    emails: 55000,
    users: 25,
    live: false,
  },
] as const;
