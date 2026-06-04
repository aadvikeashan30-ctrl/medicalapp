const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const connectionString = process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_fqJwFyueI1x8@ep-sparkling-resonance-ap5f5lec-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testConnection() {
  console.log('Connecting to Neon PostgreSQL database...');
  console.log(`Connection URI: ${connectionString.replace(/:([^:@]+)@/, ':****@')}`); // Hide password

  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('✔ Successfully connected to NeonDB!');

    // 1. Get current database time and PostgreSQL version
    const timeRes = await client.query('SELECT NOW() as now, version() as version;');
    console.log(`- Database Time: ${timeRes.rows[0].now}`);
    console.log(`- PostgreSQL Version: ${timeRes.rows[0].version}`);

    // 2. Perform write / read test in a temp table
    console.log('\nTesting write/read operations...');
    await client.query('CREATE TABLE IF NOT EXISTS _neon_test_connection (id SERIAL PRIMARY KEY, val VARCHAR(50), created_at TIMESTAMP DEFAULT NOW());');
    console.log('✔ Test table "_neon_test_connection" verified/created.');

    const insertRes = await client.query('INSERT INTO _neon_test_connection (val) VALUES ($1) RETURNING *;', ['Hello Neon!']);
    console.log(`✔ Inserted row: ${JSON.stringify(insertRes.rows[0])}`);

    const selectRes = await client.query('SELECT * FROM _neon_test_connection ORDER BY id DESC LIMIT 1;');
    console.log(`✔ Fetched row: ${JSON.stringify(selectRes.rows[0])}`);

    await client.query('DROP TABLE _neon_test_connection;');
    console.log('✔ Test table cleaned up.');

    console.log('\nNeon PostgreSQL connection is fully functional and ready!');
  } catch (err) {
    console.error('❌ Failed to connect to Neon PostgreSQL:', err.message);
    console.error(err);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

testConnection();
