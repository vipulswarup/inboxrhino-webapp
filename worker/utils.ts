import type { Context } from 'hono';
import type { Env, Variables } from './types';

const encoder = new TextEncoder();

export const FREE_INBOX_LIMIT = 11;
export const FREE_EMAIL_LIMIT = 33;
export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const AUDIT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
export const IDEMPOTENCY_MS = 24 * 60 * 60 * 1000;
export const MAX_RAW_EMAIL_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_COUNT = 25;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_DECODED_EMAIL_BYTES = 10 * 1024 * 1024;
export const MAX_EMAIL_PART_BYTES = 1024 * 1024;
export const MAX_EMAIL_HEADERS = 500;
export const MAX_FILENAME_BYTES = 255;
export const MAX_CONTENT_TYPE_BYTES = 255;
export const INBOX_BURST_LIMIT = 10;
export const ORGANISATION_BURST_LIMIT = 25;
export const EMAIL_BURST_WINDOW_MS = 5 * 60 * 1000;

const adjectives = ['bright', 'calm', 'cheerful', 'clever', 'gentle', 'lucky', 'merry', 'quiet', 'swift', 'warm'];
const animals = ['badger', 'falcon', 'gecko', 'koala', 'otter', 'panda', 'rhino', 'tiger', 'wren', 'yak'];
const reserved = new Set([
  'admin',
  'administrator',
  'abuse',
  'postmaster',
  'support',
  'security',
  'billing',
  'root',
  'hostmaster',
  'webmaster',
  'noreply',
  'no-reply',
  'donotreply',
  'inboxrhino',
  'contact',
]);

export function jsonError(c: Context<{ Bindings: Env; Variables: Variables }>, status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503, code: string, message: string) {
  return c.json({ error: { code, message, request_id: c.get('requestId') } }, status);
}

export function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
}

export function randomToken(bytes = 24) {
  const value = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(value, (part) => part.toString(16).padStart(2, '0')).join('');
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (part) => part.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

export function currentPeriod(now = new Date()) {
  const startsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { key: startsAt.toISOString().slice(0, 10), startsAt, endsAt };
}

export function normalizePrefix(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/.test(normalized)) return null;
  if (reserved.has(normalized)) return null;
  return normalized;
}

type ParsedInteger = { value: number } | { error: string };

export function parseLimit(value: string | undefined, fallback = 50): ParsedInteger {
  if (value === undefined) return { value: fallback };
  if (!/^\d+$/.test(value)) return { error: 'limit must be an integer between 1 and 100.' };
  const parsed = Number(value);
  if (parsed < 1 || parsed > 100) return { error: 'limit must be an integer between 1 and 100.' };
  return { value: parsed };
}

export function parseWaitSeconds(value: string | undefined): ParsedInteger {
  if (value === undefined) return { value: 0 };
  if (!/^\d+$/.test(value)) return { error: 'wait_seconds must be an integer between 0 and 180.' };
  const parsed = Number(value);
  if (parsed < 0 || parsed > 180) return { error: 'wait_seconds must be an integer between 0 and 180.' };
  return { value: parsed };
}

export function parseRfc3339(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function generatedPrefix() {
  const bytes = crypto.getRandomValues(new Uint8Array(2));
  const adjective = adjectives[bytes[0] % adjectives.length];
  const animal = animals[bytes[1] % animals.length];
  const suffix = randomToken(6);
  return `${adjective}-${animal}-${suffix}`;
}

export function cleanPreview(value: string, limit = 180) {
  return value.replace(/\s+/g, ' ').trim().slice(0, limit);
}

export function toIso(value: number | null) {
  return value === null ? null : new Date(value).toISOString();
}

export async function sleep(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function contentBytes(content: ArrayBuffer | Uint8Array | string) {
  if (typeof content === 'string') return encoder.encode(content);
  return content instanceof Uint8Array ? content : new Uint8Array(content);
}

export function utf8Length(value: string) {
  return encoder.encode(value).byteLength;
}
