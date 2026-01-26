
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config({ path: '.env.local' });

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
const columnId = "96a965d6-ab7a-4ff9-9f08-56a49c7313fe"; // ID from user error

const pool = new Pool({ connectionString, ssl: true });

(async () => {
    try {
        console.log("Testing getCards for column:", columnId);
        const res = await pool.query('SELECT * FROM cards WHERE column_id = $1 ORDER BY order_index ASC, created_at DESC', [columnId]);
        console.log("Query SUCCESS. Rows found:", res.rows.length);
        console.log(JSON.stringify(res.rows, null, 2));
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error("Query FAILED:", err);
        await pool.end();
        process.exit(1);
    }
})();
