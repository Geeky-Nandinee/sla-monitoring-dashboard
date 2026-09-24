require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'sla_monitoring';

  console.log(`Connecting to MySQL server at ${host}:${port} as user ${user}...`);

  let connection;
  try {
    // Connection without database specified to create database if not exists
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });

    console.log(`Creating database '${database}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.query(`USE \`${database}\`;`);

    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');

    // Remove USE statements to avoid overriding selection
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toLowerCase().startsWith('use ') && !s.toLowerCase().startsWith('create database'));

    for (const stmt of statements) {
      await connection.query(stmt);
    }

    console.log('✅ Database schema initialized successfully!');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDB();
