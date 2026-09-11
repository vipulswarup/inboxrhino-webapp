import type { Metadata } from 'next';
import { CodeSnippet } from '@/app/code-snippet';
import { Endpoint, SpecTable } from '@/app/doc-ui';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import {
  authHeader,
  createInboxCurl,
  deleteInboxCurl,
  downloadAttachmentCurl,
  errorExample,
  errorRows,
  getMessageCurl,
  inboxCreatedExample,
  messageListExample,
  usageExample,
  waitForMessageCurl,
} from '@/app/lib/api-docs';
import { API_ORIGIN, FILES_ORIGIN, OPENAPI_PATH, POSTMAN_COLLECTION_PATH } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';
import { DocsPager } from '@/app/docs-pager';

export const metadata: Metadata = pageMeta(
  '/docs/api',
  'InboxRhino API reference — inboxes, messages and wait-for-mail',
  'Full /v1 reference for InboxRhino: authentication, create inbox, wait for messages, attachments, usage and error codes. Includes OpenAPI and Postman.',
);

const toc = [
  ['#downloads', 'Downloads'],
  ['#agent-notes', 'Notes for agents'],
  ['#base', 'Base URL and conventions'],
  ['#auth', 'Authentication'],
  ['#workflow', 'Typical test workflow'],
  ['#quotas', 'Quotas and rate limits'],
  ['#health', 'Health'],
  ['#inboxes', 'Inboxes'],
  ['#messages', 'Messages'],
  ['#attachments', 'Attachments'],
  ['#usage', 'Usage'],
  ['#errors', 'Errors'],
];

export default function ApiPage() {
  return (
    <article className="space-y-10 pb-16">
      <PageBreadcrumbs
        items={[
          { name: 'Documentation', path: '/docs' },
          { name: 'API reference', path: '/docs/api' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">API reference</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          InboxRhino is a receive-only test-email API. Create an address, wait for a real inbound message, inspect it, then delete the inbox. There is no send endpoint, no org-wide message search, and no SDK. Call the API from tests, CI, or a backend — browser JavaScript on an arbitrary origin is blocked by CORS. New here? Start with the{' '}
          <a href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
            API quickstart
          </a>{' '}
          or{' '}
          <a href="/docs/playwright" className="font-bold text-[#0F3D3E]">
            Playwright email tests
          </a>
          .
        </p>
      </div>

      <nav className="rounded-xl border border-[#1C1917]/10 bg-white p-4 text-sm">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">On this page</p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {toc.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="font-semibold text-stone-700 hover:text-[#0F3D3E]">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="downloads" className="space-y-3">
        <h2 className="text-xl font-bold">Downloads</h2>
        <p className="text-sm leading-6 text-stone-600">
          Both files are free. No account is required to download them. Put your API key only in Postman collection variables or a secret manager — never commit it.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={POSTMAN_COLLECTION_PATH}
            download="InboxRhino.postman_collection.json"
            className="rounded-lg bg-[#0F3D3E] px-4 py-2 text-sm font-bold text-white"
          >
            Download Postman collection
          </a>
          <a
            href={OPENAPI_PATH}
            download="inboxrhino.openapi.yaml"
            className="rounded-lg border border-[#0F3D3E] px-4 py-2 text-sm font-bold text-[#0F3D3E]"
          >
            Download OpenAPI spec
          </a>
        </div>
        <p className="text-sm leading-6 text-stone-600">
          Import the collection in Postman: File → Import, then select the downloaded JSON. Set the collection variable <code className="font-mono text-xs">apiKey</code> to your live key. OpenAPI is also at{' '}
          <a href={OPENAPI_PATH} className="font-bold text-[#0F3D3E]">
            {OPENAPI_PATH}
          </a>{' '}
          for agents that fetch specs.
        </p>
      </section>

      <section id="agent-notes" className="space-y-3">
        <h2 className="text-xl font-bold">Notes for AI agents</h2>
        <p className="text-sm leading-6 text-stone-600">
          Prefer this page plus <code className="font-mono text-xs">{OPENAPI_PATH}</code> over guessing. Public operations have stable <code className="font-mono text-xs">operationId</code> values. Do not call <code className="font-mono text-xs">/console/*</code>, <code className="font-mono text-xs">/setup</code>, or invent send/search routes.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600">
          <li>
            Recommended sequence: <code className="font-mono text-xs">getUsage</code> → <code className="font-mono text-xs">createInbox</code> → tell the app under test to send mail to <code className="font-mono text-xs">data.address</code> → <code className="font-mono text-xs">listOrWaitForMessages</code> with <code className="font-mono text-xs">wait_seconds=180</code>, <code className="font-mono text-xs">limit=1</code>, <code className="font-mono text-xs">include=content</code> → assert → <code className="font-mono text-xs">deleteInbox</code>.
          </li>
          <li>
            Empty non-waiting list: HTTP <code className="font-mono text-xs">200</code> with <code className="font-mono text-xs">{`{ "data": [], "next_cursor": null }`}</code>. Wait timeout: HTTP <code className="font-mono text-xs">204</code> with an empty body. Do not parse JSON on 204.
          </li>
          <li>
            <code className="font-mono text-xs">include=content</code> is valid only with <code className="font-mono text-xs">limit=1</code>. Otherwise the API returns 422 <code className="font-mono text-xs">invalid_include</code>.
          </li>
          <li>
            Message filters are AND. <code className="font-mono text-xs">subject</code> is a case-insensitive substring. <code className="font-mono text-xs">sender</code> is an exact email. <code className="font-mono text-xs">sender_domain</code> is an exact domain. Use <code className="font-mono text-xs">received_after</code> (RFC 3339) so an older matching message is not reused.
          </li>
          <li>
            Invalid query values return 422. They are never clamped. Out-of-range <code className="font-mono text-xs">limit</code> or <code className="font-mono text-xs">wait_seconds</code> is an error.
          </li>
          <li>
            API keys cannot create keys, invite users, or change billing. Those exist only in the signed-in console.
          </li>
          <li>
            Attachment bytes live at {FILES_ORIGIN} using the same Bearer key. Files are not malware-scanned. Treat them as untrusted.
          </li>
        </ul>
      </section>

      <section id="base" className="space-y-3">
        <h2 className="text-xl font-bold">Base URL and conventions</h2>
        <SpecTable
          headers={['Host', 'Use']}
          rows={[
            [API_ORIGIN, 'REST /v1 and /health'],
            [FILES_ORIGIN, 'Attachment downloads (same path and auth as GET /v1/attachments/{id})'],
            ['https://test.inboxrhino.in', 'Receiving domain only. Inbox addresses are local-part@test.inboxrhino.in. Not an HTTP API.'],
          ]}
        />
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600">
          <li>
            JSON request and response bodies use snake_case. Unknown JSON properties are rejected.
          </li>
          <li>Timestamps are RFC 3339 in UTC.</li>
          <li>
            Collection endpoints return <code className="font-mono text-xs">{`{ "data": [...], "next_cursor": string | null }`}</code>. Single resources return <code className="font-mono text-xs">{`{ "data": { ... } }`}</code>. Usage is a bare object (no <code className="font-mono text-xs">data</code> wrapper).
          </li>
          <li>
            Default page size is 50, maximum 100. Pass the previous <code className="font-mono text-xs">next_cursor</code> as <code className="font-mono text-xs">cursor</code>. Cursors are opaque.
          </li>
          <li>
            Every response includes <code className="font-mono text-xs">X-Request-Id</code>. Errors also repeat that id in the JSON body.
          </li>
          <li>
            <code className="font-mono text-xs">/v1</code> is backward compatible. Breaking changes require a new versioned path.
          </li>
          <li>Receive-only: you cannot send mail through this API. SMTP to a deleted or unknown address is rejected.</li>
        </ul>
      </section>

      <section id="auth" className="space-y-3">
        <h2 className="text-xl font-bold">Authentication</h2>
        <p className="text-sm leading-6 text-stone-600">
          Create keys in the web console. The secret is shown once. Format: <code className="font-mono text-xs">ir_live_</code> + 16 lowercase hex characters + <code className="font-mono text-xs">_</code> + 48 lowercase hex characters.
        </p>
        <CodeSnippet code={authHeader} />
        <p className="text-sm leading-6 text-stone-600">
          <code className="font-mono text-xs">GET /health</code> is the only public route that does not require a key. CORS allows the console host, <code className="font-mono text-xs">*.chatgpt.site</code>, and <code className="font-mono text-xs">http://localhost</code> / <code className="font-mono text-xs">127.0.0.1</code> with a port. Automated tests should send the Bearer header from the test runner, not from a third-party web page.
        </p>
      </section>

      <section id="workflow" className="space-y-3">
        <h2 className="text-xl font-bold">Typical test workflow</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-stone-600">
          <li>Create an inbox. Store <code className="font-mono text-xs">data.id</code> and <code className="font-mono text-xs">data.address</code>.</li>
          <li>Point the application under test at that address (signup, reset, invite, OTP, and similar).</li>
          <li>
            Wait with <code className="font-mono text-xs">wait_seconds=180</code> and a subject or sender filter. Handle 200 (match) and 204 (timeout) separately.
          </li>
          <li>Assert on <code className="font-mono text-xs">text</code>, <code className="font-mono text-xs">html</code>, headers, or attachment metadata.</li>
          <li>Delete the inbox so active-inbox quota is released. Deleting a message does not restore monthly email quota.</li>
        </ol>
        <CodeSnippet code={waitForMessageCurl} />
      </section>

      <section id="quotas" className="space-y-3">
        <h2 className="text-xl font-bold">Quotas and rate limits</h2>
        <SpecTable
          headers={['Limit', 'Value']}
          rows={[
            ['Active inboxes', '11'],
            ['Inbound emails', '33 per UTC calendar month'],
            ['Message retention', '30 days'],
            ['HTTP rate limit', '120 requests / minute / API key; 600 / minute / organisation'],
            ['Concurrent waits', '30 long-polls / organisation; 10 / API key'],
            ['Wait duration', '0–180 seconds'],
          ]}
        />
        <p className="text-sm leading-6 text-stone-600">
          Email quota is reserved when the message is accepted. Failed parse or persistence releases that reservation. Over-quota inbound SMTP is rejected with <code className="font-mono text-xs">Monthly recipient quota exceeded</code> and is not stored. Mail to an unknown or deleted address is rejected with <code className="font-mono text-xs">Recipient address rejected</code>.
        </p>
      </section>

      <section id="health" className="space-y-3">
        <h2 className="text-xl font-bold">Health</h2>
        <Endpoint method="GET" path="/health" operationId="getHealth">
          <p className="text-sm leading-6 text-stone-600">No authentication. Confirms the Worker is up.</p>
          <CodeSnippet code={`GET ${API_ORIGIN}/health\n\n{"status":"ok","service":"inboxrhino-api"}`} />
        </Endpoint>
      </section>

      <section id="inboxes" className="space-y-3">
        <h2 className="text-xl font-bold">Inboxes</h2>
        <Endpoint method="POST" path="/v1/inboxes" operationId="createInbox">
          <p className="text-sm leading-6 text-stone-600">
            Creates a receive-only address on test.inboxrhino.in and the matching Cloudflare Email Routing rule. Body may be omitted or empty. The only allowed JSON field is <code className="font-mono text-xs">prefix</code>.
          </p>
          <SpecTable
            headers={['Field', 'Where', 'Rules']}
            rows={[
              ['Authorization', 'header', 'Bearer API key. Required.'],
              [
                'Idempotency-Key',
                'header',
                'Optional. 8–200 characters. Retained 24 hours. Same key + same normalized body returns the cached 201. Same key + different body returns 409 idempotency_key_reused. In-flight reuse returns 409 idempotency_in_progress with Retry-After: 1.',
              ],
              [
                'prefix',
                'JSON body',
                'Optional. 3–40 characters after lowercase normalization. Pattern [a-z0-9], hyphens allowed in the middle, must start and end with alphanumeric. Reserved names are rejected: admin, administrator, abuse, postmaster, support, security, billing, root, hostmaster, webmaster, noreply, no-reply, donotreply, inboxrhino, contact.',
              ],
            ]}
          />
          <p className="text-sm leading-6 text-stone-600">Success is 201. Omit prefix to receive a generated local-part such as bright-otter-ab12.</p>
          <CodeSnippet code={createInboxCurl} />
          <CodeSnippet code={inboxCreatedExample} />
        </Endpoint>

        <Endpoint method="GET" path="/v1/inboxes" operationId="listInboxes">
          <p className="text-sm leading-6 text-stone-600">Lists active inboxes for the organisation. Newest first.</p>
          <SpecTable
            headers={['Query', 'Default', 'Rules']}
            rows={[
              ['limit', '50', 'Integer 1–100. Invalid values return 422 invalid_limit.'],
              ['cursor', 'none', 'Opaque value from a previous next_cursor. Invalid values return 422 invalid_cursor.'],
            ]}
          />
        </Endpoint>

        <Endpoint method="GET" path="/v1/inboxes/{inbox_id}" operationId="getInbox">
          <p className="text-sm leading-6 text-stone-600">Returns one active inbox. Unknown, deleted, or foreign ids return 404 inbox_not_found.</p>
        </Endpoint>

        <Endpoint method="DELETE" path="/v1/inboxes/{inbox_id}" operationId="deleteInbox">
          <p className="text-sm leading-6 text-stone-600">
            Removes the Email Routing rule, deletes retained messages and stored objects, and frees an active-inbox slot. Success is 204 with an empty body. Monthly email quota is not restored.
          </p>
          <CodeSnippet code={deleteInboxCurl} />
        </Endpoint>
      </section>

      <section id="messages" className="space-y-3">
        <h2 className="text-xl font-bold">Messages</h2>
        <Endpoint method="GET" path="/v1/inboxes/{inbox_id}/messages" operationId="listOrWaitForMessages">
          <p className="text-sm leading-6 text-stone-600">
            Lists retained messages for one inbox, or waits until a match arrives. There is no organisation-wide list. Filters combine with AND. Without <code className="font-mono text-xs">include=content</code>, each item is a summary (no text, html, headers, or attachments).
          </p>
          <SpecTable
            headers={['Query', 'Default', 'Rules']}
            rows={[
              ['wait_seconds', '0', 'Integer 0–180. 0 returns immediately. Greater than 0 long-polls until a match or timeout.'],
              ['limit', '50', 'Integer 1–100. Must be 1 when include=content.'],
              ['cursor', 'none', 'Opaque pagination cursor.'],
              ['subject', 'none', 'Case-insensitive substring of the subject.'],
              ['sender', 'none', 'Exact case-insensitive sender email.'],
              ['sender_domain', 'none', 'Exact case-insensitive domain (no @).'],
              ['received_after', 'none', 'RFC 3339. Messages with received_at at or after this instant.'],
              ['include', 'none', 'Only allowed value: content. Requires limit=1. Adds text, html, headers, attachments.'],
            ]}
          />
          <SpecTable
            headers={['Status', 'When']}
            rows={[
              ['200', 'At least one match, or a non-waiting empty list ({ "data": [], "next_cursor": null }).'],
              ['204', 'wait_seconds > 0 and no match before timeout. Empty body — do not call response.json().'],
              ['404', 'Inbox missing: inbox_not_found.'],
              ['422', 'Invalid query: invalid_limit, invalid_cursor, invalid_include, invalid_wait_seconds, invalid_sender, invalid_sender_domain, invalid_received_after.'],
              ['429', 'rate_limit_exceeded or long_poll_limit_exceeded.'],
            ]}
          />
          <CodeSnippet code={messageListExample} />
        </Endpoint>

        <Endpoint method="GET" path="/v1/messages/{message_id}" operationId="getMessage">
          <p className="text-sm leading-6 text-stone-600">
            Returns the complete parsed message: summary fields plus internet_message_id, text, html, headers (array of [name, value] pairs), and attachments. Always includes content; no include query is needed.
          </p>
          <CodeSnippet code={getMessageCurl} />
        </Endpoint>

        <Endpoint method="DELETE" path="/v1/messages/{message_id}" operationId="deleteMessage">
          <p className="text-sm leading-6 text-stone-600">
            Deletes the message and stored objects. Success is 204. Does not restore monthly email quota. Prefer deleting the inbox at the end of a test unless you must keep the address.
          </p>
        </Endpoint>
      </section>

      <section id="attachments" className="space-y-3">
        <h2 className="text-xl font-bold">Attachments</h2>
        <Endpoint method="GET" path="/v1/attachments/{attachment_id}" operationId="downloadAttachment">
          <p className="text-sm leading-6 text-stone-600">
            Downloads raw bytes. Use the <code className="font-mono text-xs">download_url</code> from the message, which points at {FILES_ORIGIN}. The same path on {API_ORIGIN} is implemented by the same Worker. Auth is still the API Bearer key. Response is not JSON: Content-Disposition is <code className="font-mono text-xs">attachment</code>, Content-Type is the stored MIME type, Cache-Control is <code className="font-mono text-xs">private, no-store</code>. Content is not malware-scanned.
          </p>
          <CodeSnippet code={downloadAttachmentCurl} />
        </Endpoint>
      </section>

      <section id="usage" className="space-y-3">
        <h2 className="text-xl font-bold">Usage</h2>
        <Endpoint method="GET" path="/v1/usage" operationId="getUsage">
          <p className="text-sm leading-6 text-stone-600">
            Current free-tier plan, UTC month window, active inbox count, and emails received this period. No <code className="font-mono text-xs">data</code> wrapper. <code className="font-mono text-xs">plan</code> is currently always <code className="font-mono text-xs">free</code>.
          </p>
          <CodeSnippet code={usageExample} />
        </Endpoint>
      </section>

      <section id="errors" className="space-y-3">
        <h2 className="text-xl font-bold">Errors</h2>
        <p className="text-sm leading-6 text-stone-600">
          Public <code className="font-mono text-xs">/v1</code> errors always use this envelope. Branch on <code className="font-mono text-xs">error.code</code>, not on the human message. Include <code className="font-mono text-xs">request_id</code> or the <code className="font-mono text-xs">X-Request-Id</code> header when asking for support.
        </p>
        <CodeSnippet code={errorExample} />
        <SpecTable headers={['code', 'HTTP', 'Meaning']} rows={errorRows} />
      </section>
      <DocsPager />
    </article>
  );
}
