#!/usr/bin/env node
/**
 * Mint single-use Starter access codes.
 *
 *   node scripts/create-access-code.mjs [count] [note] [days-valid]
 *
 * Prints each plaintext code once and the SQL to store only its SHA-256 hash.
 * Run the SQL with: wrangler d1 execute inboxrhino-prod -c wrangler.backend.jsonc --remote --file <file>
 */
import { createHash, randomBytes } from 'node:crypto';

export function mintAccessCode() {
  const code = `IR-${randomBytes(10).toString('hex').toUpperCase().match(/.{5}/g).join('-')}`;
  return { code, hash: createHash('sha256').update(code).digest('hex') };
}

/** @param {{ hash: string, note?: string, now?: number, validDays?: number }} options */
export function accessCodeInsert({ hash, note, now = Date.now(), validDays = 0 }) {
  const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
  const expires = validDays ? now + validDays * 86_400_000 : 'NULL';
  return `INSERT INTO access_codes (code_hash, plan, note, created_at, expires_at) VALUES (${quote(hash)}, 'starter', ${note ? quote(note) : 'NULL'}, ${now}, ${expires});`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const count = Math.min(100, Math.max(1, Number(process.argv[2] ?? 1) || 1));
  const note = process.argv[3];
  const validDays = Number(process.argv[4]) || 0;
  const minted = Array.from({ length: count }, mintAccessCode);
  console.log('-- Codes (hand these out; they are not stored in plaintext):');
  for (const { code } of minted) console.log(`-- ${code}`);
  console.log('');
  for (const { hash } of minted) console.log(accessCodeInsert({ hash, note, validDays }));
}
