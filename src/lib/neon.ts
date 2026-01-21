import { Pool } from '@neondatabase/serverless';

// Default to unpooled for simple queries, but connection pooling is better for serverless
// Netlify provides NETLIFY_DATABASE_URL which usually points to the pooled connection if configured
const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

export const pool = new Pool({
    connectionString,
});
