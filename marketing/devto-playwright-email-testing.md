---
title: Test signup and OTP email in Playwright without a plugin
published: false
description: Use a real receive-only inbox and Playwright's request API to wait up to 180 seconds for verification mail, then delete the inbox. No SDK required.
tags: playwright, testing, javascript, qa
canonical_url: https://inboxrhino.in/docs/playwright
---

<!-- TODO: author name and DEV username -->

> **Disclosure:** I build InboxRhino, a receive-only test-email API. This tutorial uses it, and the official guide is at <https://inboxrhino.in/docs/playwright>.

When a signup flow depends on email, an end-to-end test should verify the message your staging app actually sends. This walkthrough uses Playwright's built-in request API to create a real inbox, wait for verification mail, inspect its content, follow the link, and delete the inbox afterward. No Playwright plugin or InboxRhino SDK is required.

## Why not a local SMTP catcher or a fixed sleep?

A local SMTP catcher such as Mailpit is a good choice when the app sends to a local SMTP server and you want a self-contained local test. But if staging sends through a real provider such as SES or Postmark, that message will not appear in the local catcher unless you reconfigure the mail path or run a catcher sidecar in CI. A real MX inbox lets the same test receive mail from the staging app's normal mail provider.

A fixed `sleep(5000)` is also brittle. It wastes time when mail arrives quickly and still fails when delivery takes longer than expected. A shared mailbox can make parallel tests pick up one another's messages. Instead, create an inbox per test and ask the API to wait for a matching message, using a timestamp and filters to avoid reusing older mail.

## Prerequisites

You will need:

- A Playwright test project.
- A staging application that sends real email and can be configured with a test signup URL.
- An InboxRhino API key stored as `INBOXRHINO_API_KEY` in your local environment or CI secrets.

Create API keys in the InboxRhino console. The secret is shown once. Do not commit it to your repository. InboxRhino is receive-only: it receives mail sent by your app but cannot send, reply, or forward messages.

## The full Playwright email test

This example creates a fresh inbox, fills in the signup form with its address, waits for a matching verification message, follows the link, and deletes the inbox in `finally`. The API returns HTTP 200 when a message matches and HTTP 204 with an empty body when the wait times out. The test handles the timeout before attempting to parse JSON.

```ts
import { test, expect } from '@playwright/test';

const API = 'https://api.inboxrhino.in';

async function responseError(response: { status(): number; text(): Promise<string> }) {
  return `HTTP ${response.status()}: ${await response.text()}`;
}

test('completes signup through the verification email', async ({ page, request }) => {
  const key = process.env.INBOXRHINO_API_KEY;
  test.skip(!key, 'Set INBOXRHINO_API_KEY');
  if (!key) return;
  const auth = { Authorization: `Bearer ${key}` };
  const startedAt = new Date().toISOString();
  const prefix = `signup-${Date.now().toString(36)}`;
  let inboxId: string | undefined;

  try {
    const created = await request.post(`${API}/v1/inboxes`, {
      headers: { ...auth, 'Content-Type': 'application/json' },
      data: { prefix },
    });
    expect(created.status(), await responseError(created)).toBe(201);
    const inbox = await created.json();
    inboxId = inbox.data.id;

    await page.goto(process.env.SIGNUP_URL ?? 'http://localhost:3000/signup');
    await page.getByLabel('Email').fill(inbox.data.address);
    await page.getByRole('button', { name: /sign up|create account/i }).click();

    const query = new URLSearchParams({
      wait_seconds: '180',
      limit: '1',
      include: 'content',
      subject: 'Verify',
      sender: 'noreply@example.com',
      received_after: startedAt,
    });
    const mail = await request.get(`${API}/v1/inboxes/${inboxId}/messages?${query}`, {
      headers: auth,
      timeout: 190_000,
    });
    expect(mail.status(), mail.status() === 204
      ? 'No matching message arrived within 180 seconds'
      : await responseError(mail)).toBe(200);

    const body = await mail.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].subject).toMatch(/verify/i);
    const html = body.data[0].html ?? '';
    const verificationUrl = html.match(/href=["'](https?:\/\/[^"']+)["']/i)?.[1];
    expect(verificationUrl, 'Verification link missing from message HTML').toBeTruthy();
    await page.goto(verificationUrl!);
    await expect(page.getByText(/verified|account is ready/i)).toBeVisible();
  } finally {
    if (inboxId) {
      const deleted = await request.delete(`${API}/v1/inboxes/${inboxId}`, { headers: auth });
      expect(deleted.status(), await responseError(deleted)).toBe(204);
    }
  }
});
```

`include=content` requires `limit=1`. The message filters combine with AND: `subject` is a case-insensitive substring, while `sender` matches the exact sender email. `received_after` uses an RFC 3339 timestamp; here it prevents an older matching message from satisfying this test. If the wait returns 204, its body is empty, so do not call `response.json()` on that response.

## Adapt the application-specific lines

Replace the signup URL, email field label, submit button name, sender address, subject filter, and final success assertion with values from your application. Keep the InboxRhino API requests, `received_after` timestamp, wait settings, and `finally` cleanup intact.

The example reads a link from the HTML body. If the message contains several links, parse the one owned by your application instead of assuming the first `href` is the verification link. For an OTP flow, parse the code from `text` or `html` and submit it through your app's UI; InboxRhino does not extract OTPs for you in v1.

## Run it in CI

Store `INBOXRHINO_API_KEY` as a CI secret and provide `SIGNUP_URL` for a staging application that sends real email. The test runner sends the Bearer header directly to InboxRhino's API; do not make the request from an unrelated browser page. The 190-second request timeout allows the API's 180-second wait to finish.

A minimal GitHub Actions job can run the same Playwright test:

```yaml
name: Playwright email test
on: [push]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          INBOXRHINO_API_KEY: ${{ secrets.INBOXRHINO_API_KEY }}
          SIGNUP_URL: https://staging.example.com/signup
```

The inbox is deleted in `finally`, including when an assertion fails, so it does not keep using an active-inbox slot. Deleting a message does not restore the monthly inbound email quota.

## Limits and quotas

The live free plan includes 11 active inboxes and 33 inbound emails per UTC calendar month for one organisation user. Messages are retained for 30 days, then deleted. The service is receive-only. Paid checkout is not available yet; Starter access codes are complimentary, and other paid plan prices are planned. See the [pricing page](https://inboxrhino.in/pricing) for current limits and checkout status.

For the API contract, including status codes, filters, and quotas, see the [API reference](https://inboxrhino.in/docs/api). Start from the [API quickstart](https://inboxrhino.in/docs/quickstart) to create a key and make your first test inbox. The maintained [Playwright email testing guide](https://inboxrhino.in/docs/playwright) is the canonical reference for this workflow. If you use Cypress, there is also a [Cypress email testing guide](https://inboxrhino.in/docs/cypress).
