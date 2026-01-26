
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config({ path: '.env.local' });

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

(async () => {
    try {
        console.log("Fixing default colors of existing columns...");
        const client = await pool.connect();

        // Update Hex light grey and Tailwind light grey to Slate-500 (darker)
        const res = await client.query(`
            UPDATE columns 
            SET color = 'bg-slate-500' 
            WHERE color IN ('#e2e8f0', 'bg-slate-200', 'bg-slate-100', '#f1f5f9')
            RETURNING id, title, color;
        `);

        console.log(`Updated ${res.rowCount} columns to 'bg-slate-500'.`);
        res.rows.forEach(r => console.log(` - ${r.title} (${r.id})`));

        client.release();
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
})();
