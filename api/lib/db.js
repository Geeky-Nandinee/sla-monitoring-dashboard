const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

function getPool() {
  if (!pool) {
    const rawHost = (process.env.MYSQL_HOST || 'localhost').trim();
    const rawUser = (process.env.MYSQL_USER || 'root').trim();
    const rawPassword = (process.env.MYSQL_PASSWORD || '').trim();
    const rawDatabase = (process.env.MYSQL_DATABASE || 'defaultdb').trim();
    const rawPort = parseInt((process.env.MYSQL_PORT || '3306').trim(), 10);
    const rawSsl = (process.env.MYSQL_SSL || 'false').trim().toLowerCase();

    const config = {
      host: rawHost,
      port: isNaN(rawPort) ? 3306 : rawPort,
      user: rawUser,
      password: rawPassword,
      database: rawDatabase,
      waitForConnections: true,
      connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '10', 10),
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    };

    if (rawSsl === 'true' || rawSsl === '1') {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = mysql.createPool(config);
  }
  return pool;
}

/**
 * Execute parameterized query with connection pool
 */
async function query(sql, params = []) {
  const p = getPool();
  const [rows] = await p.query(sql, params);
  return rows;
}

/**
 * Execute transaction using pool connection
 */
async function executeTransaction(callback) {
  const p = getPool();
  const connection = await p.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  getPool,
  query,
  executeTransaction
};
