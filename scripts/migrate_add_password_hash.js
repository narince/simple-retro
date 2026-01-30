
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
        console.log('Starting migration: Add password_hash to users table...');

        // Check if column exists
        const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='password_hash';
    `);

        if (checkRes.rows.length === 0) {
            console.log('Column password_hash not found. Adding it...');
            await pool.query('ALTER TABLE users ADD COLUMN password_hash text;');
            console.log('Successfully added password_hash column.');
        } else {
            console.log('Column password_hash already exists. Skipping.');
        }

        // Also double check schema.sql for future consistency (handled by manual edit in next step, but good to note)
        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
