import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  try {
    const { env } = await import('$env/dynamic/private');
    databaseUrl = env.DATABASE_URL;
  } catch (e) {
    console.error('Failed to load DATABASE_URL from env: ', e);
  }
}

if (!databaseUrl) throw new Error('DATABASE_URL is not set');

export const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });
