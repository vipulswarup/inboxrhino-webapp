// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'js-yaml';
import { convertV4MiniflareOptions, Miniflare } from 'miniflare';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app, cleanup, receiveEmail } from './index';
import { verifyFirebaseIdToken } from './firebase-auth';
import { reconciliationStatements } from '../scripts/reconcile-setup.mjs';
vi.mock('./firebase-auth', () => ({ verifyFirebaseIdToken: vi.fn() }));
import type { Env } from './types';
import { AUDIT_RETENTION_MS, currentPeriod, sha256 } from './utils';

const apiKey = 'ir_live_0123456789abcdef_0123456789abcdef0123456789abcdef0123456789abcdef';

type OpenApiDocument = {
  paths: Record<string, Record<string, { operationId?: string }>>;
};

let miniflare: Miniflare | undefined;
let env: Env;
let pending: Promise<unknown>[];
let routeSequence: number;

const executionContext = () =>
  ({
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
    passThroughOnException() {},
    props: {},
  }) as unknown as ExecutionContext;

async function applyMigrations(db: D1Database) {
  const names = ['0000_premium_penance.sql', '0001_foamy_meltdown.sql', '0002_optimal_korg.sql', '0003_optimal_psylocke.sql', '0004_auth_users.sql'];
  for (const name of names) {
    const sql = await readFile(join(process.cwd(), 'migrations', name), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint').map((part) => part.trim()).filter(Boolean)) {
      await db.prepare(statement).run();
    }
  }
}

async function request(path: string, init: RequestInit = {}, token = apiKey) {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await app.request(`https://api.inboxrhino.in${path}`, { ...init, headers }, env, executionContext());
  await Promise.all(pending.splice(0));
  return response;
}

async function seedMessage(id: string, organisationId: string, inboxId: string, receivedAt: number, expiresAt = receivedAt + 86_400_000) {
  await env.DB.prepare(
    `INSERT INTO messages
     (id, organisation_id, inbox_id, internet_message_id, sender_email, sender_name, recipient, subject, preview, headers_json,
      text_object_key, html_object_key, size_bytes, received_at, expires_at)
     VALUES (?, ?, ?, NULL, 'sender@example.com', 'Sender', 'contract@test.inboxrhino.in', ?, '', '[]', NULL, NULL, 100, ?, ?)`,
  )
    .bind(id, organisationId, inboxId, `Subject ${id}`, receivedAt, expiresAt)
    .run();
}

beforeEach(async () => {
  miniflare = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: 'export default { fetch() { return new Response("test"); } };',
      compatibilityDate: '2026-08-27',
      d1Databases: { DB: `contract-${crypto.randomUUID()}` },
      r2Buckets: { MAIL: `contract-${crypto.randomUUID()}` },
    }),
  );
  const db = (await miniflare.getD1Database('DB')) as unknown as D1Database;
  const mail = (await miniflare.getR2Bucket('MAIL')) as unknown as R2Bucket;
  env = {
    DB: db,
    MAIL: mail,
    SETUP_TOKEN: 'setup-test',
    CLOUDFLARE_EMAIL_ROUTING_TOKEN: 'routing-test',
    CLOUDFLARE_ZONE_ID: 'zone-test',
    EMAIL_WORKER_NAME: 'inboxrhino-api',
    INBOX_DOMAIN: 'test.inboxrhino.in',
    FIREBASE_PROJECT_ID: 'inboxrhino-test',
    TURNSTILE_SECRET_KEY: '1x000000000000000000000000000000AA',
  };
  pending = [];
  routeSequence = 0;
  await applyMigrations(db);
  const now = Date.now();
  await db.batch([
    db.prepare("INSERT INTO organisations (id, name, plan, created_at) VALUES ('org_test', 'Contract Test', 'free', ?)").bind(now),
    db.prepare("INSERT INTO domains (id, name, active, created_at) VALUES ('dom_test', 'test.inboxrhino.in', 1, ?)").bind(now),
    db.prepare("INSERT INTO api_keys (id, organisation_id, name, prefix, secret_hash, created_at) VALUES ('key_test', 'org_test', 'Contract key', 'ir_live_0123456789abcdef', ?, ?)")
      .bind(await sha256(apiKey), now),
  ]);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      routeSequence += 1;
      return new Response(JSON.stringify({ success: true, result: { id: `route-${routeSequence}` } }), {
        status: init?.method === 'DELETE' ? 200 : 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await miniflare?.dispose();
  miniflare = undefined;
});

describe('OpenAPI contract', () => {
  it('documents every public Worker operation', async () => {
    const document = load(await readFile(join(process.cwd(), 'openapi.yaml'), 'utf8')) as OpenApiDocument;
    const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);
    const documented = Object.entries(document.paths)
      .flatMap(([path, operations]) =>
        Object.keys(operations)
          .filter((method) => methods.has(method))
          .map((method) => `${method.toUpperCase()} ${path.replaceAll(/\{[^}]+\}/g, ':id')}`),
      )
      .sort();
    const implemented = app.routes
      .filter(
        (route) =>
          methods.has(route.method.toLowerCase()) &&
          route.path !== '/setup' &&
          !route.path.startsWith('/console'),
      )
      .map((route) => `${route.method.toUpperCase()} ${route.path}`)
      .sort();

    expect(documented).toEqual(implemented);
  });
});

describe('InboxRhino API contract', () => {
  it('requires authentication and returns the documented empty list envelope', async () => {
    expect((await request('/v1/usage', {}, '')).status).toBe(401);
    const response = await request('/v1/inboxes');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [], next_cursor: null });
  });

  it('strictly validates create input and safely replays idempotent requests', async () => {
    const unknown = await request('/v1/inboxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: 'contract-box', extra: true }),
    });
    expect(unknown.status).toBe(422);
    await expect(unknown.json()).resolves.toMatchObject({ error: { code: 'unknown_property' } });

    const create = () =>
      request('/v1/inboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'contract-idempotency' },
        body: JSON.stringify({ prefix: 'Contract-Box' }),
      });
    const first = await create();
    expect(first.status).toBe(201);
    const firstBody = (await first.json()) as { data: { id: string; address: string } };
    expect(firstBody.data.address).toBe('contract-box@test.inboxrhino.in');

    const replay = await create();
    expect(replay.status).toBe(201);
    await expect(replay.json()).resolves.toEqual(firstBody);
    expect(routeSequence).toBe(1);

    const conflict = await request('/v1/inboxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'contract-idempotency' },
      body: JSON.stringify({ prefix: 'different-box' }),
    });
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toMatchObject({ error: { code: 'idempotency_key_reused' } });

    const audit = await env.DB.prepare("SELECT expires_at - created_at AS retention FROM audit_events WHERE action = 'inbox.created'")
      .first<{ retention: number }>();
    expect(audit?.retention).toBe(AUDIT_RETENTION_MS);
  });

  it('enforces the active-inbox quota under concurrent creation', async () => {
    const responses = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        request('/v1/inboxes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix: `parallel-${index.toString().padStart(2, '0')}` }),
        }),
      ),
    );
    expect(responses.filter((response) => response.status === 201)).toHaveLength(11);
    expect(responses.filter((response) => response.status === 409)).toHaveLength(1);
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM inboxes WHERE status = 'active'").first<{ count: number }>();
    expect(count?.count).toBe(11);
  });

  it('paginates messages and returns 200 rather than 204 for an empty non-waiting list', async () => {
    const now = Date.now();
    await env.DB.prepare(
      "INSERT INTO inboxes (id, organisation_id, domain_id, local_part, address, status, created_at) VALUES ('inbox_messages', 'org_test', 'dom_test', 'contract', 'contract@test.inboxrhino.in', 'active', ?)",
    )
      .bind(now)
      .run();
    await seedMessage('msg_a', 'org_test', 'inbox_messages', now - 1_000);
    await seedMessage('msg_b', 'org_test', 'inbox_messages', now - 2_000);
    await seedMessage('msg_c', 'org_test', 'inbox_messages', now - 3_000);

    const first = await request('/v1/inboxes/inbox_messages/messages?limit=2');
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as { data: Array<{ id: string }>; next_cursor: string };
    expect(firstBody.data.map((message) => message.id)).toEqual(['msg_a', 'msg_b']);
    expect(firstBody.next_cursor).toBeTruthy();

    const second = await request(`/v1/inboxes/inbox_messages/messages?limit=2&cursor=${encodeURIComponent(firstBody.next_cursor)}`);
    const secondBody = (await second.json()) as { data: Array<{ id: string }>; next_cursor: null };
    expect(secondBody.data.map((message) => message.id)).toEqual(['msg_c']);
    expect(secondBody.next_cursor).toBeNull();

    await env.DB.prepare('DELETE FROM messages').run();
    const empty = await request('/v1/inboxes/inbox_messages/messages');
    expect(empty.status).toBe(200);
    await expect(empty.json()).resolves.toEqual({ data: [], next_cursor: null });

    const invalid = await request('/v1/inboxes/inbox_messages/messages?limit=1.5');
    expect(invalid.status).toBe(422);
  });

  it('enforces tenant isolation for object identifiers', async () => {
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO organisations (id, name, plan, created_at) VALUES ('org_other', 'Other', 'free', ?)").bind(now),
      env.DB.prepare(
        "INSERT INTO inboxes (id, organisation_id, domain_id, local_part, address, status, created_at) VALUES ('inbox_other', 'org_other', 'dom_test', 'other', 'other@test.inboxrhino.in', 'active', ?)",
      ).bind(now),
    ]);
    await seedMessage('msg_other', 'org_other', 'inbox_other', now);
    expect((await request('/v1/inboxes/inbox_other')).status).toBe(404);
    expect((await request('/v1/messages/msg_other')).status).toBe(404);
  });

  it('reserves inbound-email quota atomically', async () => {
    const now = Date.now();
    const period = currentPeriod();
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO inboxes (id, organisation_id, domain_id, local_part, address, status, created_at) VALUES ('inbox_mail', 'org_test', 'dom_test', 'mail', 'mail@test.inboxrhino.in', 'active', ?)",
      ).bind(now),
      env.DB.prepare("INSERT INTO usage_counters (organisation_id, period_start, received_count) VALUES ('org_test', ?, 32)").bind(period.key),
    ]);
    const rejected: string[] = [];
    const makeMessage = () => {
      const raw = 'From: Sender <sender@example.com>\r\nTo: mail@test.inboxrhino.in\r\nSubject: Quota test\r\nContent-Type: text/plain\r\n\r\nHello';
      return {
        from: 'sender@example.com',
        to: 'mail@test.inboxrhino.in',
        raw: new Response(raw).body!,
        rawSize: raw.length,
        headers: new Headers(),
        setReject(reason: string) {
          rejected.push(reason);
        },
        async forward() {},
        async reply() {},
      } as unknown as ForwardableEmailMessage;
    };

    await Promise.all([receiveEmail(makeMessage(), env), receiveEmail(makeMessage(), env)]);
    expect(rejected).toEqual(['Monthly recipient quota exceeded']);
    const usage = await env.DB.prepare("SELECT received_count FROM usage_counters WHERE organisation_id = 'org_test' AND period_start = ?")
      .bind(period.key)
      .first<{ received_count: number }>();
    const messages = await env.DB.prepare("SELECT COUNT(*) AS count FROM messages WHERE inbox_id = 'inbox_mail'").first<{ count: number }>();
    expect(usage?.received_count).toBe(33);
    expect(messages?.count).toBe(1);
  });

  it('drains every expired-message cleanup batch', async () => {
    const now = Date.now();
    await env.DB.prepare(
      "INSERT INTO inboxes (id, organisation_id, domain_id, local_part, address, status, created_at) VALUES ('inbox_cleanup', 'org_test', 'dom_test', 'cleanup', 'cleanup@test.inboxrhino.in', 'active', ?)",
    )
      .bind(now)
      .run();
    for (let offset = 0; offset < 501; offset += 100) {
      await env.DB.batch(
        Array.from({ length: Math.min(100, 501 - offset) }, (_, index) => {
          const id = `expired_${(offset + index).toString().padStart(3, '0')}`;
          return env.DB.prepare(
            `INSERT INTO messages
             (id, organisation_id, inbox_id, sender_email, sender_name, recipient, subject, preview, headers_json,
              text_object_key, html_object_key, size_bytes, received_at, expires_at)
             VALUES (?, 'org_test', 'inbox_cleanup', 'sender@example.com', '', 'cleanup@test.inboxrhino.in', '', '', '[]', NULL, NULL, 1, ?, ?)`,
          ).bind(id, now - 100_000, now - 1);
        }),
      );
    }

    await cleanup(env);
    const remaining = await env.DB.prepare("SELECT COUNT(*) AS count FROM messages WHERE inbox_id = 'inbox_cleanup'").first<{ count: number }>();
    expect(remaining?.count).toBe(0);
  }, 15_000);
});


describe('authenticated console lifecycle', () => {
  async function consoleUser(verified = true) {
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO users (id, firebase_uid, email, email_verified, created_at, last_login_at) VALUES ('user_console', 'firebase_console', 'owner@example.com', ?, ?, ?)").bind(verified ? 1 : 0, now, now),
      env.DB.prepare("INSERT INTO organisation_members (organisation_id, user_id, role, joined_at) VALUES ('org_test', 'user_console', 'owner', ?)").bind(now),
    ]);
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ sub: 'firebase_console', email: 'owner@example.com', email_verified: verified, auth_time: Math.floor(now / 1000), exp: Math.floor(now / 1000) + 3600, iss: 'test', aud: 'inboxrhino-test' });
  }

  it('shows email received through a console-generated API key, including every attachment', async () => {
    await consoleUser();
    const keyResponse = await request('/console/api-keys', { method: 'POST', body: JSON.stringify({ name: 'Console lifecycle' }) }, 'firebase-test');
    expect(keyResponse.status).toBe(201);
    const key = (await keyResponse.json() as { data: { api_key: string } }).data.api_key;
    const inboxResponse = await request('/v1/inboxes', { method: 'POST', body: JSON.stringify({ prefix: 'console-test' }) }, key);
    expect(inboxResponse.status).toBe(201);
    const inbox = (await inboxResponse.json() as { data: { id: string; address: string } }).data;
    const raw = [
      'From: Sender <sender@example.com>', `To: ${inbox.address}`, 'Subject: Console received email',
      'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="parts"', '',
      '--parts', 'Content-Type: text/plain', '', 'Actual received content',
      '--parts', 'Content-Type: text/plain', 'Content-Disposition: attachment; filename="one.txt"', '', 'First file',
      '--parts', 'Content-Type: text/plain', 'Content-Disposition: attachment; filename="two.txt"', '', 'Second file', '--parts--', '',
    ].join('\r\n');
    const setReject = vi.fn();
    await receiveEmail({ from: 'sender@example.com', to: inbox.address, raw: new Response(raw).body!, rawSize: raw.length, headers: new Headers(), setReject } as unknown as ForwardableEmailMessage, env);
    expect(setReject).not.toHaveBeenCalled();
    const list = await request(`/console/inboxes/${inbox.id}/messages`, {}, 'firebase-test');
    expect(list.status).toBe(200);
    const summaries = await list.json() as { data: Array<{ id: string; subject: string; text?: string }> };
    expect(summaries.data).toHaveLength(1);
    expect(summaries.data[0].subject).toBe('Console received email');
    expect(summaries.data[0].text).toBeUndefined();
    const full = await request(`/console/messages/${summaries.data[0].id}`, {}, 'firebase-test');
    const detail = await full.json() as { data: { text: string; attachments: Array<{ id: string; filename: string }> } };
    expect(detail.data.text).toContain('Actual received content');
    expect(detail.data.attachments.map((file) => file.filename).sort()).toEqual(['one.txt', 'two.txt']);
    for (const file of detail.data.attachments) {
      const download = await request(`/console/attachments/${file.id}`, {}, 'firebase-test');
      expect(download.status).toBe(200);
      expect(download.headers.get('Content-Disposition')).toContain('attachment;');
      expect(await download.text()).toContain(file.filename === 'one.txt' ? 'First file' : 'Second file');
    }
    await env.DB.prepare("INSERT INTO organisations (id, name, plan, created_at) VALUES ('org_isolated', 'Other', 'free', ?)").bind(Date.now()).run();
    await env.DB.prepare("UPDATE organisation_members SET organisation_id = 'org_isolated' WHERE user_id = 'user_console'").run();
    expect((await request(`/console/messages/${summaries.data[0].id}`, {}, 'firebase-test')).status).toBe(404);
    expect((await request(`/console/inboxes/${inbox.id}/messages`, {}, 'firebase-test')).status).toBe(404);
    expect((await request(`/console/attachments/${detail.data.attachments[0].id}`, {}, 'firebase-test')).status).toBe(404);
  });

  it('rejects unverified mailbox access', async () => {
    await consoleUser(false);
    expect((await request('/console/inboxes', {}, 'firebase-test')).status).toBe(403);
  });

  it('reconciles an orphaned setup organisation atomically without losing usage or mail', async () => {
    await consoleUser();
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO organisations (id, name, plan, created_at) VALUES ('org_setup', 'Setup', 'free', ?)").bind(now),
      env.DB.prepare("INSERT INTO api_keys (id, organisation_id, name, prefix, secret_hash, created_at) VALUES ('key_setup', 'org_setup', 'Initial', 'ir_live_setup', 'hash', ?)").bind(now),
      env.DB.prepare("INSERT INTO inboxes (id, organisation_id, domain_id, local_part, address, status, created_at) VALUES ('inbox_setup', 'org_setup', 'dom_test', 'setup', 'setup@test.inboxrhino.in', 'active', ?)").bind(now),
      env.DB.prepare("INSERT INTO usage_counters VALUES ('org_setup', '2026-09', 2)"),
      env.DB.prepare("INSERT INTO usage_counters VALUES ('org_test', '2026-09', 3)"),
    ]);
    await seedMessage('msg_setup', 'org_setup', 'inbox_setup', now);
    const statements = reconciliationStatements({ source: 'org_setup', target: 'org_test', ownerEmail: 'owner@example.com', keyPrefix: 'ir_live_setup', now });
    await env.DB.prepare(statements[0]).run();
    // A failed insert must roll back every change made by the repair trigger.
    await env.DB.prepare(`CREATE TRIGGER fail_repair AFTER INSERT ON audit_events WHEN NEW.action = 'organisation.setup_reconciled' BEGIN SELECT RAISE(ABORT, 'simulated failure'); END`).run();
    await expect(env.DB.prepare(statements[1]).run()).rejects.toThrow('simulated failure');
    expect(await env.DB.prepare("SELECT organisation_id FROM messages WHERE id='msg_setup'").first('organisation_id')).toBe('org_setup');
    expect(await env.DB.prepare("SELECT received_count FROM usage_counters WHERE organisation_id='org_test'").first('received_count')).toBe(3);
    await env.DB.prepare('DROP TRIGGER fail_repair').run();
    await env.DB.prepare(statements[1]).run();
    await env.DB.prepare(statements[2]).run();
    expect(await env.DB.prepare("SELECT organisation_id FROM messages WHERE id='msg_setup'").first('organisation_id')).toBe('org_test');
    expect(await env.DB.prepare("SELECT received_count FROM usage_counters WHERE organisation_id='org_test'").first('received_count')).toBe(5);
    expect((await request('/console/messages/msg_setup', {}, 'firebase-test')).status).toBe(200);
  });
});
