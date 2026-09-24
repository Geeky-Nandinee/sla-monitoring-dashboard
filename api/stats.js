const { calculateMetrics } = require('./lib/metrics');

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

    const metricsData = await calculateMetrics({
      fromDate,
      toDate,
      service
    });

    return res.status(200).json({
      success: true,
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        service: service || 'all'
      },
      data: metricsData
    });
  } catch (err) {
    console.error('Stats Endpoint Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An error occurred while fetching SLA statistics.'
    });
  }
};
