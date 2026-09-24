const { query } = require('./db');
const { SLA_TARGET_PERCENT } = require('./constants');

/**
 * Calculates overall and per-service SLA metrics from database records.
 * Supports date range and service filters.
 */
async function calculateMetrics(filters = {}) {
  const { fromDate, toDate, service } = filters;

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

  // 1. Overview Aggregation SQL
  const summarySql = `
    SELECT
      COUNT(*) AS total_checks,
      SUM(CASE WHEN is_valid = 1 THEN 1 ELSE 0 END) AS valid_checks,
      SUM(CASE WHEN is_valid = 0 THEN 1 ELSE 0 END) AS invalid_checks,
      SUM(CASE WHEN is_valid = 1 AND status_code >= 200 AND status_code < 400 THEN 1 ELSE 0 END) AS successful_checks,
      SUM(CASE WHEN is_valid = 1 AND status_code >= 400 THEN 1 ELSE 0 END) AS failed_checks,
      AVG(CASE WHEN latency_ms IS NOT NULL THEN latency_ms ELSE NULL END) AS avg_latency_ms,
      COUNT(CASE WHEN quality_issue IS NOT NULL THEN 1 ELSE NULL END) AS total_quality_issues,
      COUNT(DISTINCT service) AS total_services,
      COUNT(DISTINCT agent) AS total_agents
    FROM monitoring_checks
    ${whereSql}
  `;

  const summaryRows = await query(summarySql, params);
  const summary = summaryRows[0] || {};

  const totalChecks = parseInt(summary.total_checks || 0, 10);
  const validChecks = parseInt(summary.valid_checks || 0, 10);
  const successfulChecks = parseInt(summary.successful_checks || 0, 10);
  const failedChecks = parseInt(summary.failed_checks || 0, 10);
  const avgLatencyMs = summary.avg_latency_ms !== null ? Math.round(parseFloat(summary.avg_latency_ms)) : 0;
  const qualityIssuesCount = parseInt(summary.total_quality_issues || 0, 10);
  const totalServices = parseInt(summary.total_services || 0, 10);
  const totalAgents = parseInt(summary.total_agents || 0, 10);

  // SLA Availability Calculation
  const availabilityPct = validChecks > 0 ? parseFloat(((successfulChecks / validChecks) * 100).toFixed(3)) : 100.0;
  const slaStatus = availabilityPct >= SLA_TARGET_PERCENT ? 'Met' : 'Breached';

  // 2. P95 Latency Calculation
  const latencySql = `
    SELECT latency_ms
    FROM monitoring_checks
    ${whereSql ? `${whereSql} AND` : 'WHERE'} latency_ms IS NOT NULL
    ORDER BY latency_ms ASC
  `;
  const latencyRows = await query(latencySql, params);
  let p95LatencyMs = 0;
  if (latencyRows.length > 0) {
    const p95Index = Math.floor(latencyRows.length * 0.95);
    p95LatencyMs = latencyRows[Math.min(p95Index, latencyRows.length - 1)].latency_ms;
  }

  // 3. Per-Service Metrics Breakdown
  const perServiceSql = `
    SELECT
      service,
      COUNT(*) AS total_checks,
      SUM(CASE WHEN is_valid = 1 THEN 1 ELSE 0 END) AS valid_checks,
      SUM(CASE WHEN is_valid = 1 AND status_code >= 200 AND status_code < 400 THEN 1 ELSE 0 END) AS successful_checks,
      SUM(CASE WHEN is_valid = 1 AND status_code >= 400 THEN 1 ELSE 0 END) AS failed_checks,
      AVG(CASE WHEN latency_ms IS NOT NULL THEN latency_ms ELSE NULL END) AS avg_latency_ms
    FROM monitoring_checks
    ${whereSql}
    GROUP BY service
    ORDER BY service ASC
  `;
  const serviceRows = await query(perServiceSql, params);

  const servicesBreakdown = serviceRows.map(row => {
    const sValid = parseInt(row.valid_checks || 0, 10);
    const sSuccess = parseInt(row.successful_checks || 0, 10);
    const sAvail = sValid > 0 ? parseFloat(((sSuccess / sValid) * 100).toFixed(3)) : 100.0;
    return {
      service: row.service,
      total_checks: parseInt(row.total_checks || 0, 10),
      failed_checks: parseInt(row.failed_checks || 0, 10),
      availability_pct: sAvail,
      sla_status: sAvail >= SLA_TARGET_PERCENT ? 'Met' : 'Breached',
      avg_latency_ms: row.avg_latency_ms !== null ? Math.round(parseFloat(row.avg_latency_ms)) : 0
    };
  });

  return {
    overall: {
      sla_target_pct: SLA_TARGET_PERCENT,
      availability_pct: availabilityPct,
      sla_status: slaStatus,
      total_checks: totalChecks,
      valid_checks: validChecks,
      failed_checks: failedChecks,
      avg_latency_ms: avgLatencyMs,
      p95_latency_ms: p95LatencyMs,
      data_quality_issues: qualityIssuesCount,
      total_services: totalServices,
      total_agents: totalAgents
    },
    by_service: servicesBreakdown
  };
}

module.exports = {
  calculateMetrics
};
