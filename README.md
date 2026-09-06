# InboxRhino

InboxRhino is a Cloudflare-hosted, receive-only email API for end-to-end tests. It creates real addresses on `test.inboxrhino.in`, receives mail through Cloudflare Email Routing, stores parsed message content in D1 and R2, and exposes it through a versioned REST API.

The current release includes the free-tier API, Firebase sign-in, self-service organisation provisioning and API-key management, and an authenticated live console.

## Repository map

- `worker/` — Hono API, inbound email handler, authentication, quota enforcement, retention cleanup, and Email Routing automation.
- `app/` — Next/vinext visual inbox.
- `db/schema.ts` and `migrations/` — D1 schema and ordered migrations.
- `openapi.yaml` — authoritative public API contract.
- `postman/InboxRhino.postman_collection.json` — runnable end-to-end API workflow.
- `wrangler.backend.jsonc` — production Worker, D1, R2, routes, and cron bindings.

## Requirements

- Node.js 22.13 or newer.
- A Cloudflare account authenticated with Wrangler.
- The D1 database, R2 bucket, Email Routing zone, and custom hostnames declared in `wrangler.backend.jsonc`.
- A Cloudflare API token limited to Email Routing Rules read/edit access for the InboxRhino zone.

Install dependencies:

```bash
npm install
```

Copy `.dev.vars.example` to `.dev.vars` and replace both placeholder values. Never commit `.dev.vars`, an API key, or a setup token.

## Local development

Apply D1 migrations and start the API Worker:

```bash
npm run db:migrate:local
npm run dev:worker
```

In a second terminal, start the visual inbox:

```bash
npm run dev
```

The marketing preview displays sample messages. The authenticated console uses a Firebase session to show real mailboxes in the signed-in organisation. Set `NEXT_PUBLIC_INBOXRHINO_API_URL` in `.env.local` to the local Worker URL when developing locally; otherwise it uses the production API.

## Verification

Run the complete pre-release gate:

```bash
npm run check
```

This performs linting, TypeScript checking, unit and Worker-level contract tests, OpenAPI route parity checks, and a dry-run Worker build. The contract suite uses Cloudflare's local Worker simulator and therefore needs permission to open a localhost port.

The tests cover:

- authentication and error envelopes;
- strict request validation;
- idempotent inbox creation and payload conflicts;
- concurrent active-inbox and inbound-email quota enforcement;
- cursor pagination and long-poll response semantics;
- cross-organisation object isolation;
- 90-day security-audit retention; and
- cleanup backlogs larger than one 500-message batch.

## API quickstart

All `/v1` requests use `Authorization: Bearer <api-key>`. Keep API keys in a secret manager or CI secret; do not place them in source code.

Create an inbox:

```bash
curl --request POST https://api.inboxrhino.in/v1/inboxes \
  --header "Authorization: Bearer $INBOXRHINO_API_KEY" \
  --header "Content-Type: application/json" \
  --header "Idempotency-Key: signup-test-$CI_PIPELINE_ID" \
  --data '{"prefix":"signup-test"}'
```

After the application sends mail to the returned address, wait for it:

```bash
curl --get https://api.inboxrhino.in/v1/inboxes/INBOX_ID/messages \
  --header "Authorization: Bearer $INBOXRHINO_API_KEY" \
  --data-urlencode "wait_seconds=180" \
  --data-urlencode "limit=1" \
  --data-urlencode "include=content" \
  --data-urlencode "subject=Verify" \
  --data-urlencode "received_after=2026-08-31T00:00:00Z"
```

A match returns `200` with the normal `{ "data": [...], "next_cursor": null }` envelope. A long-poll timeout returns `204`. A non-waiting empty message list returns `200` with an empty `data` array.

Delete the inbox at the end of the test to release active-inbox capacity:

```bash
curl --request DELETE https://api.inboxrhino.in/v1/inboxes/INBOX_ID \
  --header "Authorization: Bearer $INBOXRHINO_API_KEY"
```

Import `postman/InboxRhino.postman_collection.json` for the same lifecycle with automatic variable capture.

## Contract rules

- `/v1` is backward compatible; breaking changes require a new versioned path.
- List endpoints default to 50 items, accept 1–100, and use opaque cursor pagination.
- Invalid query values return `422`; they are not silently clamped.
- `POST /v1/inboxes` idempotency keys last 24 hours. Concurrent reuse returns `idempotency_in_progress`; reuse with another normalized body returns `idempotency_key_reused`.
- Normal API traffic is limited to 120 requests/minute/API key and 600 requests/minute/organisation.
- Free organisations may have 11 active or provisioning inboxes and receive 33 successfully stored messages per UTC calendar month.
- Messages and attachments expire after 30 days. Metadata-only security audit events expire after 90 days.
- All errors use `{ "error": { "code", "message", "request_id" } }`; `X-Request-Id` is also returned as a response header.

See `openapi.yaml` for the complete request and response schemas.

## Production deployment

The release command validates the project, applies pending D1 migrations, and deploys the Worker:

```bash
npm run release:worker
```

The migration runs before the new Worker is published. Migrations must remain backward-compatible with the currently deployed Worker so a failed deployment does not leave production unusable.

After deployment, verify at minimum:

```bash
curl --fail https://api.inboxrhino.in/health
```

Then run the Postman lifecycle with a non-production test inbox: usage, create, receive, wait, retrieve, delete message, and delete inbox.

## Operational notes

- The scheduled cleanup runs daily at `02:17 UTC` and drains all complete 500-message batches before pruning expired idempotency, rate-limit, long-poll, audit, and quarantine records.
- Creating an inbox reserves a D1 row before its Cloudflare routing rule is created. Failed provisioning removes both the reservation and idempotency placeholder.
- Inbound quota is reserved atomically before MIME parsing. Failed parsing or persistence releases the reservation.
- Message bodies and attachments have no application-level backup and are irrecoverable after deletion. D1 Time Travel is the metadata disaster-recovery mechanism.
- Attachment downloads are authenticated, forced with `Content-Disposition: attachment`, marked `nosniff`, and are not malware-scanned.

## Live console

- Navigation has visible Mailboxes, API Keys and Usage labels on desktop and mobile.
- Mailbox and message summaries refresh every five seconds while the page is visible, on window focus, and with Refresh. Usage refreshes every fifteen seconds.
- Selecting a mailbox preserves that selection during refresh. Superseded requests are aborted and their responses ignored.
- Email content loads only for the selected summary. A failed detail request does not hide the message list; Retry email retrieves it again.
- Empty live mailboxes never display demo content. Plain-text-only email renders directly, and every attachment has its own authenticated download.
- Email verification can be refreshed with “I’ve verified my email”.
- The free tier permits 33 received emails per month, so the console's 100-message fetch covers all messages within the 30-day retention window, including across a month boundary. Paid tiers will need cursor pagination.

### API and console ownership

Create new API keys in the signed-in console: they belong to the same organisation as its mailboxes. A legacy `/setup` key can belong to an organisation without a console membership. Signing in does not grant access to that organisation automatically.

For existing installations, an administrator can use `scripts/reconcile-setup.mjs` to generate a guarded repair. Verify the source key's public prefix and the destination owner's email first. The repair requires a memberless source, a verified destination owner, combined mailbox capacity within quota, no active source long polls, and no colliding idempotency keys. It moves mailbox/message/attachment metadata, API keys, idempotency records and audit records and sums monthly usage. R2 objects and email routing rules remain at their existing locations. The mutation runs inside a SQLite trigger as one atomic audited insert; a failure rolls it back. Drop the temporary trigger after execution. This is an administrator operation, never a public ownership-claim endpoint.

### Frontend deployment

`npm run release:web` runs checks, builds the frontend and deploys its generated Worker to `app.inboxrhino.in`, `inboxrhino.in` and `www.inboxrhino.in`. These hostnames are declared in `vite.config.ts`, so rebuilding preserves the routes. `npm run release:worker` deploys the API. Deploy commands preserve configured remote runtime variables. The existing Sites publication is managed separately using `.openai/hosting.json`.

### Release verification

The test suite covers console-generated API key → API-created mailbox → MIME receipt → console summaries and content → all attachment downloads, plus cross-organisation isolation, unverified access, mailbox-selection races, automatic refresh, live empty states, and repair rollback.

## Next milestones

Phase A's sign-in, console, key management and public documentation are implemented. Complete production smoke testing for each release and address any operational issues before paid billing. Phase B remains INR checkout, paid quotas, multi-user organisations and optional TOTP MFA; those are separate from the free console release.
