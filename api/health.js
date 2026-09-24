const { query } = require('./lib/db');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET.' });
  }

  try {
    // Ping MySQL DB
    const dbPing = await query('SELECT 1 AS db_status');
    const dbConnected = dbPing && dbPing[0] && dbPing[0].db_status === 1;

    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message
    });
  }
};
