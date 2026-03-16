
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config({ path: '.env.local' });

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

(async () => {
    try {
        console.log("Adding missing columns to 'cards' table...");
        const client = await pool.connect();

        // Add order_index if not exists
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='order_index') THEN 
                    ALTER TABLE cards ADD COLUMN order_index integer DEFAULT 0; 
                END IF;
            END $$;
        `);

        // Add comments if not exists (also noticed this missing in schema vs code usage)
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='comments') THEN 
                    ALTER TABLE cards ADD COLUMN comments jsonb DEFAULT '[]'::jsonb; 
                END IF;
            END $$;
        `);

        console.log("Migration successful!");
        client.release();
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
})();
