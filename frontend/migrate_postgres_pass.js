const { Client } = require('pg');
const fs = require('fs');

async function migrate() {
    const url = 'postgresql://postgres:postgres@localhost:5432/global_access';
    console.log('Connecting to: ' + url.replace(/:[^:@]*@/, ':***@'));
    const client = new Client({ connectionString: url });
    try {
        await client.connect();
        console.log('Connected to DB!');
        const sql = fs.readFileSync('../database/schema.sql', 'utf8');
        await client.query(sql);
        console.log('Schema successfully applied!');
    } catch (e) {
        console.error('Migration failed:', e.message);
    } finally {
        await client.end();
    }
}

migrate();
