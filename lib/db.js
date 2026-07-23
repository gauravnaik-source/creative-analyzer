// Neon's HTTP driver: queries are carried over plain fetch(), not a TCP
// connection, so there's nothing here for Vercel's bundler to choke on.
// This is a different package from @vercel/postgres (which caused the
// earlier bundling failures) — it's a single small file with no native
// dependencies, and Neon tests it explicitly against Vercel Functions.
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = neon(process.env.DATABASE_URL);
