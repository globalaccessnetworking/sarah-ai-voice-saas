const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    console.log('Connecting to: ' + process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'));
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('Connected to DB');
        const sql = fs.readFileSync('../database/schema.sql', 'utf8');
        await client.query(sql);
        console.log('Schema successfully applied!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.end();
    }
}

migrate();
