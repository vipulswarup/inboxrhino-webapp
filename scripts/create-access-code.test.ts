import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { accessCodeInsert, mintAccessCode } from './create-access-code.mjs';

describe('create-access-code', () => {
  it('mints distinct codes whose stored hash is the SHA-256 of the plaintext', () => {
    const first = mintAccessCode();
    const second = mintAccessCode();
    expect(first.code).toMatch(/^IR-[0-9A-F]{5}(-[0-9A-F]{5}){3}$/);
    expect(first.code).not.toBe(second.code);
    expect(first.hash).toBe(createHash('sha256').update(first.code).digest('hex'));
  });

  it('writes SQL that stores only the hash, escapes notes and sets expiry', () => {
    const sql = accessCodeInsert({ hash: 'abc', note: "it's a test", now: 1000, validDays: 1 });
    expect(sql).toContain("'abc'");
    expect(sql).toContain("'it''s a test'");
    expect(sql).toContain('1000, 86401000');
    expect(accessCodeInsert({ hash: 'abc', now: 1000 })).toContain('1000, NULL');
  });
});
