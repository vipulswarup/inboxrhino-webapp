import { expect, test } from '@playwright/test';

const API = 'https://api.inboxrhino.in';
const key = process.env.INBOXRHINO_API_KEY;

async function errorText(response: { status(): number; text(): Promise<string> }) {
  return `HTTP ${response.status()}: ${await response.text()}`;
}

test('completes signup through the verification email', async ({ page, request }) => {
  test.skip(!key, 'Set INBOXRHINO_API_KEY');
  if (!key) return;
  const auth = { Authorization: `Bearer ${key}` };
  const startedAt = new Date().toISOString();
  let inboxId: string | undefined;

  try {
    const created = await request.post(`${API}/v1/inboxes`, {
      headers: { ...auth, 'Content-Type': 'application/json' },
      data: { prefix: `signup-${Date.now().toString(36)}` },
    });
    expect(created.status(), await errorText(created)).toBe(201);
    const inbox = await created.json();
    inboxId = inbox.data.id;

    await page.goto(process.env.SIGNUP_URL ?? 'http://localhost:3000/signup');
    await page.getByLabel('Email').fill(inbox.data.address);
    await page.getByRole('button', { name: /sign up|create account/i }).click();

    const query = new URLSearchParams({
      wait_seconds: '180',
      limit: '1',
      include: 'content',
      subject: process.env.EXPECTED_SUBJECT ?? 'Verify',
      sender: process.env.EXPECTED_SENDER ?? 'noreply@example.com',
      received_after: startedAt,
    });
    const mail = await request.get(`${API}/v1/inboxes/${inboxId}/messages?${query}`, {
      headers: auth,
      timeout: 190_000,
    });
    expect(mail.status(), mail.status() === 204 ? 'No matching message arrived in 180 seconds' : await errorText(mail)).toBe(200);

    const payload = await mail.json();
    const html = payload.data[0]?.html ?? '';
    const verificationUrl = html.match(/href=["'](https?:\/\/[^"']+)["']/i)?.[1];
    expect(verificationUrl, 'Verification link missing from message HTML').toBeTruthy();
    await page.goto(verificationUrl!);
    await expect(page.getByText(/verified|account is ready/i)).toBeVisible();
  } finally {
    if (inboxId) {
      const deleted = await request.delete(`${API}/v1/inboxes/${inboxId}`, { headers: auth });
      expect(deleted.status(), await errorText(deleted)).toBe(204);
    }
  }
});
