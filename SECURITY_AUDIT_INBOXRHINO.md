# InboxRhino security audit

**Target:** `inboxrhino.in`, `app.inboxrhino.in`, `api.inboxrhino.in`, `files.inboxrhino.in`  
**Audit date:** 14 September 2026  
**Method:** source-assisted web/API review, non-destructive live HTTP checks, dependency audit, secret-pattern scan, and existing automated tests  
**Repository reviewed:** `inboxrhino-webapp`

## Executive summary

No critical vulnerability or direct unauthenticated data-exposure path was identified. The application has several good controls: strong bearer API keys stored as hashes, constant-time secret comparisons, organisation-scoped database queries, generic error responses, no-store console responses, isolated rendering of untrusted email HTML, and forced-download attachment responses.

The audit identified **6 medium**, **6 low**, and **1 informational** findings. The most important work is:

1. prevent framing of the authenticated console and add a browser security-header baseline;
2. stop the `/news` reverse proxy from forwarding credentials to Stork;
3. replace the wildcard `*.chatgpt.site` CORS trust rule with exact origins;
4. add inbound-email size and abuse controls;
5. move the sending domains from monitoring-only to enforced anti-spoofing; and
6. make authentication throttling and Turnstile verification fail closed.

This is a point-in-time assessment, not a guarantee that the system is vulnerability-free.

## Risk summary

| ID | Severity | Priority | Finding | Status |
|---|---|---:|---|---|
| SEC-01 | Medium | P1 | Authenticated console can be framed; browser security headers are missing | Resolved and deployed |
| SEC-02 | Medium | P1 | `/news` proxy forwards sensitive request headers to a third party | Resolved and deployed |
| SEC-03 | Medium | P1 | API and console CORS trust every `*.chatgpt.site` origin | Resolved and deployed |
| SEC-04 | Medium | P1 | A known inbox address can be mail-bombed to exhaust the organisation quota | Mitigated; residual product risk |
| SEC-05 | Medium | P1 | Inbound MIME processing has no application-level size or attachment limits | Resolved and deployed |
| SEC-12 | Medium | P1 | DMARC is monitoring-only and SPF uses softfail on product domains | Pending DNS-write access |
| SEC-06 | Low | P2 | Failed-token rate-limit result is ignored | Resolved and deployed |
| SEC-07 | Low | P2 | Turnstile response context is not validated | Resolved and deployed |
| SEC-08 | Low | P2 | Firebase claim and recent-auth validation contain fail-open edge cases | Resolved and deployed |
| SEC-09 | Low | P2 | Bootstrap `/setup` remains exposed after initial provisioning | Resolved and deployed |
| SEC-10 | Low | P2 | Development toolchain has known high/moderate advisories | Resolved |
| SEC-13 | Low | P3 | DNSSEC and CAA are not configured | Pending DNS and registrar access |
| SEC-11 | Informational | P3 | No `security.txt` vulnerability-disclosure file | Resolved and deployed |

## Remediation update — 15 September 2026

Application remediations were deployed to Cloudflare as web version `3535dcd0-dd3d-4ee9-969f-cac50e5c97bc` and final API Worker version `7a89083a-a37d-4105-8a4b-1b58ee899065`.

- **SEC-01:** deployed CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, HSTS, `nosniff`, referrer policy, permissions policy, and popup-compatible COOP. Live responses were verified on the marketing, app, API, and file hosts.
- **SEC-02:** replaced the framework external rewrite with a GET/HEAD-only proxy that constructs an allowlisted outbound request, strips credentials and cookies, limits time/response size, and allowlists response headers. Canary regression tests cover `Authorization`, `Cookie`, and `X-Api-Key`.
- **SEC-03:** production CORS now allows only the exact `https://app.inboxrhino.in` origin. Localhost is enabled only in explicit development/test environments. A live unrelated `*.chatgpt.site` request no longer receives an allow-origin header.
- **SEC-04:** generated addresses now have more than 50 bits of random entropy, inboxes are limited to 10 messages per five-minute bucket, organisations to 25, and existing delete/recreate behavior provides address rotation. Repeated low-rate mail to a leaked address remains an inherent residual risk until sender controls or a more flexible quarantine workflow are added.
- **SEC-05:** deployed raw, parsed-part, attachment-count, per-attachment, aggregate-decoded, header-count, filename, and content-type limits; R2 writes are concurrency-bounded and every application rejection releases monthly quota.
- **SEC-06:** failed Firebase token attempts now return 429 with `Retry-After` at the limit and are checked before further expensive verification.
- **SEC-07:** Turnstile now binds tokens to the `signup` action, exact allowed hostname, and a five-minute challenge window.
- **SEC-08:** Firebase claim types/bounds now fail closed, recent authentication rejects missing/non-finite/future values, JWKS fetches have a timeout/cache policy, and an unknown key ID forces one refresh for rotation.
- **SEC-09:** public setup is disabled in production and live `/setup` returns a generic 404.
- **SEC-10:** Cloudflare tooling, Wrangler, Vitest, and the vulnerable nested esbuild path were updated. Full and production-only npm audits report zero known vulnerabilities.
- **SEC-11:** `/.well-known/security.txt` is published and live.
- **SEC-12/13:** no DNS mutation was made. The active Wrangler OAuth token has zone read but not DNS write. DNSSEC additionally requires publishing Cloudflare's generated DS record at Openprovider, where the domain is registered. Google DKIM is present, but final DMARC enforcement should still be coordinated with every legitimate sender.

## Detailed findings and Cursor implementation brief

### SEC-01 — Authenticated console can be framed; browser security headers are missing

**Severity:** Medium  
**Priority:** P1  
**Affected:** marketing and app HTML responses, particularly `https://app.inboxrhino.in/console`

Live responses did not include `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `Permissions-Policy`, `Referrer-Policy`, or `X-Content-Type-Options`. The API Worker sets `nosniff` and `no-referrer`, but the web application does not. The authenticated console can therefore be embedded by an attacker-controlled site. Because Firebase persistence belongs to the framed `app.inboxrhino.in` origin, an already signed-in user may see an authenticated console inside the frame and can be targeted with UI-redressing/clickjacking actions.

**Evidence**

- Live `GET https://app.inboxrhino.in/console`: HTTP 200 with none of the anti-framing headers above.
- `middleware.ts` only adds robots and caching headers; it does not apply a security baseline.
- Destructive inbox/message actions do not all require recent reauthentication, increasing the effect of successful clickjacking.

**Fix**

- Add response-header middleware for both hosts. At minimum set `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'` and `X-Frame-Options: DENY` on the app host.
- Add `X-Content-Type-Options: nosniff`, an appropriate `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- Enable HSTS at Cloudflare or in the application. Use `includeSubDomains`/`preload` only after confirming every subdomain is permanently HTTPS-capable.
- Build a full CSP allowlist for Firebase, Google sign-in, Turnstile, Analytics, and Ahrefs. Prefer nonces or hashes over adding broad `unsafe-inline`/`unsafe-eval` exceptions.
- Apply `frame-ancestors` as an HTTP response header; a CSP meta element cannot enforce it.

**Acceptance tests**

- An iframe on an unrelated origin cannot render `/login` or `/console`.
- All HTML routes return the intended security headers, including 404 pages.
- Firebase login, Google login, Turnstile, analytics, and the email viewer still work under the final CSP.

### SEC-02 — `/news` proxy forwards sensitive request headers to a third party

**Severity:** Medium  
**Priority:** P1  
**Affected:** `/news` and `/news/:path*`

`next.config.ts` implements `/news` as an external rewrite to `www.stork.ai`. The production build explicitly warns that credential headers—including `Cookie`, `Authorization`, `Proxy-Authorization`, and `X-Api-Key`—are forwarded to the external origin. Normal browser navigation does not add the InboxRhino bearer tokens automatically, which limits immediate exploitability, but any client, future middleware, monitoring system, or user that sends credentials to a same-origin `/news` URL can disclose them to Stork.

**Evidence**

- `next.config.ts:3-10` defines the external rewrite.
- `npm run build` warns that credential headers are forwarded to the external origin.
- A live `/news` response exposes Stork/Vercel response headers, confirming that the request is served by the third-party destination.

**Fix**

- Preferred: redirect `/news` to a clearly third-party Stork URL if retaining the InboxRhino URL is not required.
- Otherwise replace the generic external rewrite with a controlled route/Worker proxy that constructs a new outbound request from a strict allowlist such as `Accept`, `Accept-Language`, and a generated request ID.
- Never forward `Authorization`, `Cookie`, `Proxy-Authorization`, `X-Api-Key`, Firebase tokens, Cloudflare access headers, or arbitrary `X-*` headers.
- Apply explicit timeouts, response-size limits, allowed methods, and a fixed destination host.

**Acceptance tests**

- Send unique canary values in each sensitive header to a mock upstream and assert that none arrive.
- Assert that query strings and intended paths still work and cannot change the upstream host.

### SEC-03 — API and console CORS trust every `*.chatgpt.site` origin

**Severity:** Medium  
**Priority:** P1  
**Affected:** all Worker routes, including `/console/*` and `/v1/*`

The CORS callback reflects any origin ending in `.chatgpt.site` and permits the `Authorization` header and destructive methods. `chatgpt.site` is a shared hosting suffix, so this grants browser access to unrelated user-controlled sites on that domain. An attacker still needs a valid InboxRhino API key or Firebase token, but the rule unnecessarily expands the set of origins from which stolen, phished, or user-supplied credentials can be exercised.

**Evidence**

- `worker/index.ts:39-53` reflects any `origin.endsWith('.chatgpt.site')`.
- Live request from `https://audit-test.chatgpt.site` received `Access-Control-Allow-Origin` for that exact origin.
- Live preflight allowed `Authorization` and `DELETE`; an unrelated origin did not receive an allow-origin header.

**Fix**

- Replace suffix matching with an environment-configured set of exact, owned preview/production origins.
- Gate localhost origins behind a development environment flag rather than permitting them in production.
- If arbitrary ChatGPT-hosted clients are a product requirement, use a deliberate delegated-auth design with narrowly scoped, short-lived tokens instead of giving the whole shared suffix access to normal bearer credentials.
- Add CORS unit tests for exact allowed origins, deceptive suffixes, sibling tenants, `null`, HTTP variants, ports, and Unicode/punycode edge cases.

### SEC-04 — A known inbox address can be mail-bombed to exhaust the organisation quota

**Severity:** Medium  
**Priority:** P1  
**Affected:** inbound mail flow and monthly receive quota

Anyone who learns a test inbox address can send email to it. Every accepted message reserves one unit from the organisation-wide monthly quota; the free limit is only 33 messages. An attacker, leaked CI log, or noisy external system can therefore deny email testing to the whole organisation with a small number of messages. Generated local parts reduce discoverability but do not protect addresses placed in application configuration, logs, screenshots, or test output.

**Evidence**

- `worker/index.ts:605-615` increments the organisation counter for each accepted recipient before parsing.
- The quota is organisation-wide rather than isolated per inbox.
- Unknown recipients and malformed messages are handled safely, but valid unwanted mail still consumes quota by design.

**Fix**

- Add per-inbox and per-organisation burst limits, abuse telemetry, and alerts before the monthly quota is exhausted.
- Provide one-click address rotation and make random, high-entropy addresses the default; warn when users select predictable custom prefixes.
- Consider quarantining burst traffic instead of immediately charging every message to the scarce monthly allowance.
- Document recovery behavior and allow owners to disable a flooded inbox without losing unrelated inbox capacity.
- Do not rely solely on sender address for abuse controls because SMTP sender identity is spoofable.

**Acceptance tests**

- A burst to one inbox cannot consume the entire organisation quota.
- Legitimate parallel email tests remain reliable.
- Rejected, malformed, oversized, and quarantined messages do not permanently consume quota.

### SEC-05 — Inbound MIME processing has no application-level size or attachment limits

**Severity:** Medium  
**Priority:** P1  
**Affected:** Email Worker, PostalMime parsing, R2 storage

The parser limits nesting depth and header bytes, but the application does not explicitly cap `message.rawSize`, attachment count, individual attachment size, aggregate decoded bytes, text size, HTML size, or filename length. It converts every attachment to an in-memory byte array and starts all R2 writes concurrently. Upstream Cloudflare limits provide a ceiling, but explicit application limits are needed to control CPU, memory, storage cost, and fan-out.

**Evidence**

- `worker/index.ts:618-647` parses and materializes all message content and attachment bytes.
- `worker/index.ts:692-697` runs all object writes concurrently.
- Existing parser controls: `maxNestingDepth: 20` and `maxHeadersSize: 128 KiB`.

**Fix**

- Reject on `message.rawSize` before parsing using a documented product limit.
- After parsing and before R2 writes, enforce maximum attachment count, per-attachment bytes, aggregate decoded bytes, text/HTML bytes, header count, and filename/content-type lengths.
- Limit concurrent R2 writes rather than calling unbounded `Promise.all`.
- Record a structured rejection reason and ensure the quota reservation is released on every rejected path.
- Keep limits in named constants and publish them in the API/product documentation.

**Suggested starting limits:** 10 MiB raw message, 25 attachments, 5 MiB per attachment, 10 MiB aggregate decoded content, 1 MiB each for text and HTML, and 255 UTF-8 bytes for filenames. Tune these against real usage and Cloudflare Worker limits.

### SEC-12 — DMARC is monitoring-only and SPF uses softfail on product domains

**Severity:** Medium  
**Priority:** P1  
**Affected:** `inboxrhino.in` and `test.inboxrhino.in`

The main domain publishes `DMARC p=none`, which asks receivers to report but not quarantine or reject unauthenticated mail. Both the main and test domains use SPF `~all` (softfail). The test domain has no more restrictive subdomain DMARC record and therefore remains under the main domain's monitoring-only policy. Attackers can spoof InboxRhino-branded sender addresses more easily for phishing, fake verification messages, or abuse reports. This is especially relevant for a service whose customers are trained to trust email-testing messages.

**Evidence from public DNS**

- `inboxrhino.in TXT`: `v=spf1 include:_spf.google.com ~all`
- `_dmarc.inboxrhino.in TXT`: `v=DMARC1; p=none; ...`
- `test.inboxrhino.in TXT`: `v=spf1 include:_spf.mx.cloudflare.net ~all`
- No `_dmarc.test.inboxrhino.in` record was returned.

**Fix**

- Confirm that every legitimate sender is covered by aligned SPF and/or DKIM, including Google Workspace and any transactional provider.
- Review aggregate DMARC reports, then progress the organisational policy from `p=none` to `p=quarantine` and finally `p=reject`, initially with a controlled `pct` if needed.
- Add an explicit `sp=reject` policy or a dedicated `_dmarc.test.inboxrhino.in` `p=reject` record for the receive-only test subdomain.
- If `test.inboxrhino.in` never legitimately sends mail, publish a deny-all sender policy (`v=spf1 -all`) after confirming Cloudflare Email Routing does not require outbound use for this setup.
- Enable and verify DKIM for every legitimate sending service before enforcing DMARC.
- Confirm that the third-party DMARC aggregate-report mailbox is intentional, access-controlled, and covered by the appropriate data-handling agreement.

**Acceptance tests**

- Send aligned and deliberately unaligned test messages and inspect DMARC authentication results at multiple large mailbox providers.
- Confirm legitimate Google/transactional mail passes DKIM or aligned SPF before moving to reject.
- Confirm spoofed `From: *@test.inboxrhino.in` mail is rejected or quarantined by participating receivers.

### SEC-06 — Failed-token rate-limit result is ignored

**Severity:** Low  
**Priority:** P2  
**Affected:** `POST /console/session`

When Firebase verification fails, the code increments an IP rate-limit counter but ignores the returned `allowed` value and always responds with 401. Attackers can continue forcing JWT parsing, key lookup, signature verification, Worker execution, and D1 writes after the intended ten failures per 15 minutes.

**Evidence:** `worker/console.ts:120-125`.

**Fix**

- Check the limiter state before expensive verification when practical, and return 429 with `Retry-After` once blocked.
- At minimum, use the returned value after a failed verification and return 429 when false.
- Add a Cloudflare WAF/rate-limit rule for `/console/session` as an outer layer.
- Test the 10/15-minute boundary and confirm successful users behind shared NAT are not unnecessarily locked out.

### SEC-07 — Turnstile response context is not validated

**Severity:** Low  
**Priority:** P2  
**Affected:** new-account bootstrap in `POST /console/session`

The verification helper checks only `payload.success`. It does not validate the returned `hostname`, `action`, or token age/context. Cloudflare recommends validating the expected context to ensure a token was issued for the intended flow.

**Evidence:** `worker/turnstile.ts:1-18`.

**Fix**

- Set an explicit action such as `signup` in the widget.
- Require `hostname === 'app.inboxrhino.in'` (plus explicit development hosts outside production), `action === 'signup'`, and a recent `challenge_ts`.
- Treat missing or malformed context fields as failure and log only non-sensitive reason codes.
- Add success, wrong-host, wrong-action, stale-token, and replay/failure tests.

### SEC-08 — Firebase claim and recent-auth validation contain fail-open edge cases

**Severity:** Low  
**Priority:** P2  
**Affected:** Firebase ID-token verification and API-key create/revoke recent-auth checks

Signature, expiry, issuer, and audience are validated correctly. However, claim types and bounds are not comprehensively checked. `requireRecentAuth` only evaluates `auth.authTime < cutoff`; a missing or non-finite value makes that comparison false and therefore passes. Tokens are signed by Firebase, so practical exploitation requires an upstream token anomaly or configuration issue, but sensitive authorization checks should fail closed. In addition, an unknown signing-key ID does not trigger an immediate JWKS refresh, which can cause an avoidable authentication outage during key rotation.

**Evidence:** `worker/firebase-auth.ts:50-73`; `worker/console-auth.ts:64-70`.

**Fix**

- Validate types and sensible bounds for `exp`, `iat`, `auth_time`, `sub`, `email`, and `email_verified`; enforce Firebase's subject-length rules.
- Change recent-auth logic to reject unless `Number.isFinite(authTime)` and the value is within the permitted window and not unreasonably in the future.
- On an unknown `kid`, refresh JWKS once and retry; honor cache headers where possible.
- Unit-test missing, string, `NaN`, old, and future `auth_time` values and signing-key rotation.

### SEC-09 — Bootstrap `/setup` remains exposed after initial provisioning

**Severity:** Low  
**Priority:** P2  
**Affected:** `POST /setup`

The endpoint uses a secret header, constant-time comparison, and refuses setup when an organisation already exists. Those are good controls. It nevertheless remains internet-reachable indefinitely and has no endpoint-specific throttling. A leaked setup secret becomes dangerous if the database is ever restored or emptied, and random attempts still consume Worker/D1 resources.

**Evidence:** `worker/index.ts:63-105`; live invalid-token request correctly returned 403.

**Fix**

- Remove the public route after bootstrap or require an explicit `SETUP_ENABLED=true` deployment flag that is normally absent.
- Prefer a one-off administrative command using Cloudflare-authorized access.
- Add an edge rate limit and audit denied setup attempts without logging the token.

### SEC-10 — Development toolchain has known high/moderate advisories

**Severity:** Low for production; higher on developer/CI machines that run untrusted input  
**Priority:** P2

`npm audit` reported 4 high and 6 moderate vulnerable package entries in the full dependency tree, including paths through `@cloudflare/vite-plugin`/Miniflare/Sharp, Vitest, and the older esbuild path under Drizzle Kit. `npm audit --omit=dev` reported **zero production vulnerabilities**, so this is not evidence that the deployed runtime is vulnerable. It matters for local preview servers and CI, where malicious repository content or untrusted web access can target development services.

**Fix**

- Update `@cloudflare/vite-plugin` to at least the patched version reported by npm (`1.54.9`) and update the compatible Wrangler/Miniflare/Sharp chain.
- Upgrade Vitest to a release containing the `@vitest/mocker` path-traversal fix; follow its migration guide and run the suite.
- Review the Drizzle Kit/esbuild path manually rather than accepting npm's suggested downgrade blindly.
- Run `npm audit` and `npm audit --omit=dev` in CI, with separate policies for runtime and tooling findings.
- Bind development servers to loopback unless remote access is deliberately required.

### SEC-11 — No `security.txt` vulnerability-disclosure file

**Severity:** Informational  
**Priority:** P3

`https://inboxrhino.in/.well-known/security.txt` returns the generic HTML 404 page. Researchers have no standard channel or disclosure expectations.

**Fix:** publish an RFC 9116-style file containing at least `Contact`, `Expires`, `Canonical`, and a disclosure-policy URL. Use a monitored security address and rotate the expiry date.

### SEC-13 — DNSSEC and CAA are not configured

**Severity:** Low  
**Priority:** P3  
**Affected:** `inboxrhino.in`

Public DNS returned neither a DS record nor a CAA record. Without DNSSEC, resolvers cannot cryptographically validate the domain's DNS chain. Without CAA, any publicly trusted certificate authority may issue a certificate when its normal validation succeeds. These are defense-in-depth controls; their absence is not evidence of current compromise.

**Fix**

- Enable DNSSEC in Cloudflare and publish the generated DS record at the registrar. Verify the chain before considering the task complete; an incorrect DS record can take the domain offline.
- Publish restrictive CAA records for the certificate authorities actually used by Cloudflare and any backup issuance path. Include an incident-reporting contact if supported by the selected policy.
- Document DNS and certificate renewal ownership and alert on unexpected certificate-transparency entries.

## Controls that passed review

- **API-key handling:** keys have a high-entropy secret, are returned only at creation, are stored as SHA-256 hashes, and are compared in constant time.
- **Tenant isolation:** primary API and console object lookups are scoped by `organisation_id`; existing contract tests explicitly cover cross-tenant inbox/message identifiers.
- **Authorization:** owner, verified-email, and recent-auth requirements protect API-key management. Firebase tokens are checked for RS256 signature, expiry, exact issuer, and exact audience.
- **CSRF posture:** authenticated API calls use explicit bearer headers rather than ambient session cookies, substantially reducing conventional CSRF risk.
- **Untrusted email HTML:** email HTML is rendered in an iframe with an empty `sandbox` attribute and an injected restrictive CSP (`default-src 'none'`, no forms/base URI, data/blob-only images). This is a strong isolation design.
- **Attachments:** downloads are organisation-scoped, use `Content-Disposition: attachment`, sanitize header filenames, and receive `X-Content-Type-Options: nosniff` from Worker middleware.
- **Errors and caching:** unexpected errors return a generic message; console responses use `Cache-Control: private, no-store`; API responses use `Referrer-Policy: no-referrer` and request IDs.
- **Input handling:** create-inbox bodies reject malformed JSON and unknown fields; prefixes and idempotency keys have bounds; malformed cursors are rejected.
- **Quota concurrency:** database updates reserve inbox and inbound-message quotas atomically.
- **Secret scan:** no committed production private key, live InboxRhino API key, or concrete setup/Turnstile secret was found by the targeted pattern scan. Test fixtures and `.dev.vars.example` contain clearly non-production placeholders.
- **HTTP methods:** Cloudflare rejected TRACE with 405.
- **Production dependencies:** `npm audit --omit=dev` reported 0 known advisories on the audited lockfile.

## Verification performed

- Live response and CORS checks on all four public hosts.
- Public DNS review covering MX, SPF, DMARC, DNSSEC DS, and CAA records.
- Invalid API-key and invalid setup-token requests; expected 401/403 responses were observed.
- TRACE request; 405 observed.
- Full and production-only npm advisory audits.
- Targeted repository secret-pattern scan.
- `npm test`: 24 tests passed across email routing, SEO helpers, email-viewer isolation, and mailbox state behavior.
- `npm run typecheck`: passed.
- `npm run build`: passed and produced the external-rewrite credential-forwarding warning documented in SEC-02.
- `npm run build:worker`: passed.
- `npm run lint`: currently fails on eight Next.js internal-link rules and one image warning. These are not security findings but should be repaired so CI can enforce lint cleanly.

## Limitations

- No disruptive load test, SMTP flood, brute-force campaign, destructive data action, or exploit against another tenant was performed.
- A live dummy account was not needed for the confirmed findings. Authenticated behavior was reviewed from source and existing tenant-isolation/console tests; a future release audit should include two verified test accounts to black-box test cross-tenant access and role changes end to end.
- Cloudflare dashboard settings, WAF rules, DNSSEC, Firebase authorized domains/password policy, Google Cloud IAM, R2/D1 administrative access, CI secrets, source-control protections, and production logs were not available for review.
- Dependency results reflect the npm advisory database and lockfile on the audit date.

## Recommended remediation order

### P1 — next release

1. Add anti-framing and browser security headers (SEC-01).
2. replace or harden the Stork proxy (SEC-02).
3. restrict CORS to exact owned origins (SEC-03).
4. add recipient abuse controls and safe quota behavior (SEC-04).
5. enforce MIME and storage limits before materializing/writing content (SEC-05).
6. validate all legitimate senders and progress DMARC/SPF to enforcement (SEC-12).

### P2 — following release

1. Make failed-auth throttling effective (SEC-06).
2. validate Turnstile hostname/action/time (SEC-07).
3. harden Firebase claims, recent-auth checks, and JWKS refresh (SEC-08).
4. disable public bootstrap after provisioning (SEC-09).
5. update vulnerable development dependencies and enforce audit policy in CI (SEC-10).

### P3 — operational hardening

1. Publish `security.txt` (SEC-11).
2. Enable DNSSEC and restrict certificate issuance with CAA (SEC-13).
3. Run an authenticated two-tenant black-box regression after P1/P2 changes.
4. Review Cloudflare, Firebase, IAM, CI/CD, backup, audit-log, and incident-response configuration separately.
