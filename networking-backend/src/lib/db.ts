import { createClient } from '@libsql/client/web';

// @libsql/client/web requires https://, not the libsql:// scheme
const rawUrl = process.env.TURSO_DATABASE_URL!;
const url = rawUrl.replace(/^libsql:\/\//, 'https://');

export const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});