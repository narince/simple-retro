import { Pool } from '@neondatabase/serverless';

// Default to unpooled for simple queries, but connection pooling is better for serverless
// Netlify provides NETLIFY_DATABASE_URL which usually points to the pooled connection if configured
const connectionString =
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL;

if (!connectionString) {
    console.error("CRITICAL: No database connection string found in environment variables.");
    console.error("Available Env Keys:", Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL')));
} else {
    console.log("Database connection string configured (Length: " + connectionString.length + ")");
}

export const pool = new Pool({
    connectionString,
    ssl: true // Force SSL for Neon
});
