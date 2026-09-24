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
    const { fromDate, toDate, service } = req.query || {};
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];

    if (fromDate) {
      whereClauses.push('timestamp_utc >= ?');
      params.push(fromDate.includes(' ') ? fromDate : `${fromDate} 00:00:00`);
    }

    if (toDate) {
      whereClauses.push('timestamp_utc <= ?');
      params.push(toDate.includes(' ') ? toDate : `${toDate} 23:59:59`);
    }

    if (service && service !== 'all') {
      whereClauses.push('service = ?');
      params.push(service);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Total records count
    const countSql = `SELECT COUNT(*) as total FROM monitoring_checks ${whereSql}`;
    const countRows = await query(countSql, params);
    const totalRecords = parseInt(countRows[0].total || 0, 10);
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    // 2. Fetch paginated logs (using parameterized SQL query)
    const logsSql = `
      SELECT
        id,
        upload_id,
        DATE_FORMAT(timestamp_utc, '%Y-%m-%d %H:%i:%s') as timestamp_utc,
        service,
        status_code,
        latency_ms,
        agent,
        region,
        is_valid,
        quality_issue
      FROM monitoring_checks
      ${whereSql}
      ORDER BY timestamp_utc DESC, id DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limit, offset];
    const logs = await query(logsSql, queryParams);

    // 3. Fetch list of distinct services for UI filter dropdowns
    const servicesSql = `SELECT DISTINCT service FROM monitoring_checks ORDER BY service ASC`;
    const serviceRows = await query(servicesSql);
    const availableServices = serviceRows.map(r => r.service);

    return res.status(200).json({
      success: true,
      pagination: {
        total_records: totalRecords,
        total_pages: totalPages,
        current_page: page,
        limit
      },
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        service: service || 'all'
      },
      available_services: availableServices,
      logs
    });
  } catch (err) {
    console.error('Logs Endpoint Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An error occurred while fetching monitoring logs.'
    });
  }
};
