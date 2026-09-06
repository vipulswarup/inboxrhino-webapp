export interface Env {
  DB: D1Database;
  MAIL: R2Bucket;
  SETUP_TOKEN: string;
  CLOUDFLARE_EMAIL_ROUTING_TOKEN: string;
  CLOUDFLARE_ZONE_ID: string;
  EMAIL_WORKER_NAME: string;
  INBOX_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  TURNSTILE_SECRET_KEY: string;
}

export type AuthContext = {
  keyId: string;
  organisationId: string;
};

export type ConsoleAuthContext = {
  userId: string;
  organisationId: string;
  role: 'owner' | 'member';
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  authTime: number;
};

export type Variables = {
  auth: AuthContext;
  consoleAuth: ConsoleAuthContext;
  requestId: string;
};

export type InboxRow = {
  id: string;
  organisation_id: string;
  local_part: string;
  address: string;
  status: 'provisioning' | 'active' | 'deleted';
  routing_rule_id: string | null;
  created_at: number;
  deleted_at: number | null;
};

export type MessageRow = {
  id: string;
  organisation_id: string;
  inbox_id: string;
  internet_message_id: string | null;
  sender_email: string;
  sender_name: string;
  recipient: string;
  subject: string;
  preview: string;
  headers_json: string;
  text_object_key: string | null;
  html_object_key: string | null;
  size_bytes: number;
  received_at: number;
  expires_at: number;
};

export type AttachmentRow = {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  object_key: string;
  disposition: string;
  content_id: string | null;
};
