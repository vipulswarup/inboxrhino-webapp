/** Administrator-only repair for pre-login setup organisations. No public claim endpoint. */
export function reconciliationStatements({ source, target, ownerEmail, keyPrefix, now = Date.now() }) {
  if (!source || !target || source === target || !ownerEmail || !keyPrefix) throw new Error('Distinct organisations, owner email and public key prefix are required.');
  const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
  const from = quote(source);
  const to = quote(target);
  const auditId = quote(`setup-reconciled:${source}:${target}`);
  const triggerName = `reconcile_${source.replace(/[^a-zA-Z0-9]/g, '_')}`;
  return [
    `CREATE TRIGGER ${triggerName} BEFORE INSERT ON audit_events
     WHEN NEW.id = ${auditId}
     BEGIN
       SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM organisations WHERE id = ${from})
         OR EXISTS (SELECT 1 FROM organisation_members WHERE organisation_id = ${from})
         THEN RAISE(ABORT, 'Source must be an existing organisation without members') END;
       SELECT CASE WHEN NOT EXISTS (
         SELECT 1 FROM organisation_members m JOIN users u ON u.id = m.user_id
         WHERE m.organisation_id = ${to} AND m.role = 'owner' AND u.email = ${quote(ownerEmail)} AND u.email_verified = 1
       ) THEN RAISE(ABORT, 'Verified destination owner does not match') END;
       SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM api_keys WHERE organisation_id = ${from} AND prefix = ${quote(keyPrefix)} AND revoked_at IS NULL)
         THEN RAISE(ABORT, 'Initial key does not match source') END;
       SELECT CASE WHEN (SELECT COUNT(*) FROM inboxes WHERE organisation_id IN (${from}, ${to}) AND status IN ('active', 'provisioning')) > 11
         THEN RAISE(ABORT, 'Combined mailbox quota exceeded') END;
       SELECT CASE WHEN EXISTS (SELECT 1 FROM long_polls WHERE organisation_id = ${from} AND expires_at > ${now})
         THEN RAISE(ABORT, 'Wait for active API long polls to finish') END;
       SELECT CASE WHEN EXISTS (SELECT 1 FROM idempotency_keys a JOIN idempotency_keys b ON a.key = b.key WHERE a.organisation_id = ${from} AND b.organisation_id = ${to})
         THEN RAISE(ABORT, 'Resolve duplicate idempotency keys before repair') END;
       INSERT INTO usage_counters (organisation_id, period_start, received_count)
         SELECT ${to}, period_start, received_count FROM usage_counters WHERE organisation_id = ${from}
         ON CONFLICT(organisation_id, period_start) DO UPDATE SET received_count = received_count + excluded.received_count;
       DELETE FROM usage_counters WHERE organisation_id = ${from};
       ${['inboxes', 'messages', 'attachments', 'api_keys', 'idempotency_keys', 'long_polls', 'audit_events'].map((table) => `UPDATE ${table} SET organisation_id = ${to} WHERE organisation_id = ${from};`).join('\n       ')}
     END`,
    `INSERT INTO audit_events (id, organisation_id, actor_id, action, target_id, request_id, created_at, expires_at)
     VALUES (${auditId}, ${to}, (SELECT u.id FROM users u JOIN organisation_members m ON m.user_id=u.id WHERE m.organisation_id=${to} AND u.email=${quote(ownerEmail)} AND m.role='owner'),
       'organisation.setup_reconciled', ${from}, ${auditId}, ${now}, ${now + 90 * 86400000})`,
    `DROP TRIGGER ${triggerName}`,
  ];
}
