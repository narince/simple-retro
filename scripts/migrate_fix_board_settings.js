
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
        console.log('Starting migration: Fix Board Settings...');

        const columnsToAdd = [
            { name: 'are_cards_hidden', type: 'boolean', default: 'false' },
            { name: 'is_voting_disabled', type: 'boolean', default: 'false' },
            { name: 'is_gifs_enabled', type: 'boolean', default: 'true' },
            { name: 'is_reactions_enabled', type: 'boolean', default: 'true' },
            { name: 'is_comments_enabled', type: 'boolean', default: 'true' },
            { name: 'password_hash', type: 'text', default: 'null' }
        ];

        for (const col of columnsToAdd) {
            console.log(`Checking column: ${col.name}...`);
            const checkRes = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='boards' AND column_name=$1;
      `, [col.name]);

            if (checkRes.rows.length === 0) {
                console.log(`Adding ${col.name}...`);
                // Handle default value correctly in SQL string
                const defaultClause = col.default !== 'null' ? `DEFAULT ${col.default}` : '';
                await pool.query(`ALTER TABLE boards ADD COLUMN ${col.name} ${col.type} ${defaultClause};`);
            } else {
                console.log(`Column ${col.name} already exists. Skipping.`);
            }
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
