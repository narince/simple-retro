
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    webSocketConstructor: ws,
});

async function migrate() {
    try {
        console.log('Starting migration: Add last_logout_at to users table...');

        // Check if column exists
        const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='last_logout_at';
    `);

        if (checkRes.rows.length === 0) {
            console.log('Column last_logout_at not found. Adding it...');
            await pool.query('ALTER TABLE users ADD COLUMN last_logout_at timestamp with time zone;');
            console.log('Successfully added last_logout_at column.');
        } else {
            console.log('Column last_logout_at already exists. Skipping.');
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
