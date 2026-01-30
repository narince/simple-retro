

const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Mock dependencies since we are running in node, not nextjs env for this test
// We need to bypass the TS compilation or use ts-node.
// Since we don't know if ts-node is available, let's just make a raw js script 
// that mimics the service method logic exactly to verify the query works.

require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    webSocketConstructor: ws,
});

async function verifyCreateUser() {
    const email = `test_verification_${Date.now()}@example.com`;
    const fullName = "Verification User";
    const role = 'user';
    const password = "password123";

    try {
        console.log(`Attempting to create user: ${email}`);

        const id = crypto.randomUUID();
        const hash = await bcrypt.hash(password, 10);

        // This simulates the EXACT query in PostgresService.createUser
        const res = await pool.query(
            'INSERT INTO users (id, email, full_name, role, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [id, email, fullName, role, hash]
        );

        console.log("User created successfully!");
        console.log(res.rows[0]);

        // Cleanup
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        console.log("Cleanup: Deleted test user.");

    } catch (error) {
        console.error("FAILED to create user:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

verifyCreateUser();
