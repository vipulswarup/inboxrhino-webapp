import { API_ORIGIN, FILES_ORIGIN } from './site';

export const authHeader = `Authorization: Bearer ir_live_<16-hex-public-id>_<48-hex-secret>`;

export const createInboxCurl = `curl --request POST ${API_ORIGIN}/v1/inboxes \\
  --header "Authorization: Bearer $INBOXRHINO_API_KEY" \\
  --header "Content-Type: application/json" \\
  --header "Idempotency-Key: signup-test-1" \\
  --data '{"prefix":"signup-test"}'`;

export const waitForMessageCurl = `curl --get ${API_ORIGIN}/v1/inboxes/INBOX_ID/messages \\
  --header "Authorization: Bearer $INBOXRHINO_API_KEY" \\
  --data-urlencode "wait_seconds=180" \\
  --data-urlencode "limit=1" \\
  --data-urlencode "include=content" \\
  --data-urlencode "subject=Verify" \\
  --data-urlencode "received_after=2026-09-03T10:00:00Z"`;

export const getMessageCurl = `curl --request GET ${API_ORIGIN}/v1/messages/MESSAGE_ID \\
  --header "Authorization: Bearer $INBOXRHINO_API_KEY"`;

export const downloadAttachmentCurl = `curl --request GET ${FILES_ORIGIN}/v1/attachments/ATTACHMENT_ID \\
  --header "Authorization: Bearer $INBOXRHINO_API_KEY" \\
  --output invoice.pdf`;

export const deleteInboxCurl = `curl --request DELETE ${API_ORIGIN}/v1/inboxes/INBOX_ID \\
  --header "Authorization: Bearer $INBOXRHINO_API_KEY"`;

export const inboxCreatedExample = `{
  "data": {
    "id": "inbox_0123456789abcdef0123456789abcdef",
    "address": "signup-test@test.inboxrhino.in",
    "local_part": "signup-test",
    "status": "active",
    "created_at": "2026-09-03T10:15:30.000Z"
  }
}`;

export const messageListExample = `{
  "data": [
    {
      "id": "msg_0123456789abcdef0123456789abcdef",
      "inbox_id": "inbox_0123456789abcdef0123456789abcdef",
      "from": { "name": "Acme", "address": "noreply@example.com" },
      "to": "signup-test@test.inboxrhino.in",
      "subject": "Verify your email",
      "preview": "Use this code to verify your address.",
      "size_bytes": 4096,
      "received_at": "2026-09-03T10:16:02.000Z",
      "expires_at": "2026-10-03T10:16:02.000Z",
      "internet_message_id": "<abc@example.com>",
      "text": "Your code is 482193",
      "html": "<p>Your code is 482193</p>",
      "headers": [["Subject", "Verify your email"], ["From", "Acme <noreply@example.com>"]],
      "attachments": [
        {
          "id": "att_0123456789abcdef0123456789abcdef",
          "filename": "invoice.pdf",
          "content_type": "application/pdf",
          "size_bytes": 20480,
          "disposition": "attachment",
          "content_id": null,
          "download_url": "${FILES_ORIGIN}/v1/attachments/att_0123456789abcdef0123456789abcdef"
        }
      ]
    }
  ],
  "next_cursor": null
}`;

export const usageExample = `{
  "plan": "free",
  "period": { "starts_at": "2026-09-01T00:00:00.000Z", "ends_at": "2026-10-01T00:00:00.000Z" },
  "inboxes": { "active": 4, "limit": 11, "remaining": 7 },
  "emails": { "received": 21, "limit": 33, "remaining": 12 }
}`;

export const errorExample = `{
  "error": {
    "code": "inbox_not_found",
    "message": "Inbox not found.",
    "request_id": "8f1a2c3d9e0b1a2c"
  }
}`;

export const errorRows = [
  ['invalid_api_key', '401', 'Missing, malformed, unknown, or revoked Bearer key.'],
  ['invalid_json', '422', 'POST body is not a JSON object.'],
  ['unknown_property', '422', 'Request body included a field other than prefix.'],
  ['invalid_prefix', '422', 'Prefix failed length, character, or reserved-name rules.'],
  ['invalid_idempotency_key', '422', 'Idempotency-Key was shorter than 8 or longer than 200 characters.'],
  ['idempotency_key_reused', '409', 'Same Idempotency-Key was reused with a different normalized body.'],
  ['idempotency_in_progress', '409', 'Same key is still running. Response includes Retry-After: 1. Retry once.'],
  ['idempotency_unavailable', '503', 'Cached idempotent result could not be read. Retry the same request.'],
  ['inbox_quota_exceeded', '409', 'Organisation already has 11 active inboxes.'],
  ['address_unavailable', '409', 'Requested local-part is already taken.'],
  ['address_generation_failed', '503', 'Could not allocate a unique generated address. Retry.'],
  ['email_routing_unavailable', '502 or 503', 'Cloudflare Email Routing could not create or delete the exact address rule.'],
  ['inbox_not_found', '404', 'Inbox id is unknown, deleted, or belongs to another organisation.'],
  ['message_not_found', '404', 'Message id is unknown or already deleted.'],
  ['attachment_not_found', '404', 'Attachment metadata or stored bytes are gone.'],
  ['invalid_limit', '422', 'limit is not an integer from 1 to 100. Values are not clamped.'],
  ['invalid_cursor', '422', 'cursor is not a cursor previously returned as next_cursor.'],
  ['invalid_include', '422', 'include must be content, and only with limit=1.'],
  ['invalid_wait_seconds', '422', 'wait_seconds is not an integer from 0 to 180.'],
  ['invalid_sender', '422', 'sender is not an email address.'],
  ['invalid_sender_domain', '422', 'sender_domain contains @ or whitespace.'],
  ['invalid_received_after', '422', 'received_after is not an RFC 3339 timestamp.'],
  ['rate_limit_exceeded', '429', 'More than 120 requests/minute per key or 600/minute per organisation. Retry at the next UTC minute.'],
  ['long_poll_limit_exceeded', '429', 'More than 30 concurrent waits per organisation or 10 per key.'],
  ['internal_error', '500', 'Unexpected failure. Include X-Request-Id when reporting.'],
];
