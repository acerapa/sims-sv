import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	databaseUrl = DATABASE_URL;
}

export const client = postgres(databaseUrl as string);
export const db = drizzle(client, { schema });
