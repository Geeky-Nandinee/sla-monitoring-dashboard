const { QUALITY_ISSUES } = require('./constants');

/**
 * Parses and formats a raw timestamp string/unix int into a MySQL-compatible UTC DATETIME string (YYYY-MM-DD HH:mm:ss).
 */
function parseToUtcDateTime(rawTs) {
  if (!rawTs) return null;
  const str = String(rawTs).trim();

  let dateObj;
  if (/^\d{10}$/.test(str)) {
    // 10-digit Unix epoch timestamp (seconds)
    dateObj = new Date(parseInt(str, 10) * 1000);
  } else if (/^\d{13}$/.test(str)) {
    // 13-digit Unix epoch timestamp (milliseconds)
    dateObj = new Date(parseInt(str, 10));
  } else {
    // ISO 8601 or other standard date string
    dateObj = new Date(str);
  }

  if (isNaN(dateObj.getTime())) {
    return null;
  }

  return dateObj.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Validates HTTP status code.
 * 2xx, 3xx, 4xx, 5xx are standard HTTP status codes (100 to 599).
 * Non-standard status codes like 999 return false.
 */
function isValidHttpStatusCode(statusCodeStr) {
  const code = parseInt(statusCodeStr, 10);
  if (isNaN(code)) return false;
  return code >= 100 && code <= 599;
}

/**
 * Cleans a validated raw row according to assignment specifications.
 */
function cleanRow(rawRow) {
  const qualityIssues = [];
  let isValid = true;

  // 1. Timestamp parsing
  const timestampUtc = parseToUtcDateTime(rawRow.timestamp);
  if (!timestampUtc) {
    isValid = false;
    qualityIssues.push(QUALITY_ISSUES.INVALID_TIMESTAMP);
  }

  // 2. HTTP Status Code validation
  const statusCode = parseInt(rawRow.status_code, 10);
  if (isNaN(statusCode) || !isValidHttpStatusCode(rawRow.status_code)) {
    isValid = false;
    qualityIssues.push(QUALITY_ISSUES.INVALID_STATUS_CODE);
  }

  // 3. Latency normalization & validation
  let latencyMs = null;
  const rawLatencyStr = rawRow.latency;
  const unit = (rawRow.latency_unit || 'ms').trim().toLowerCase();

  if (rawLatencyStr === '' || rawLatencyStr === null || rawLatencyStr === undefined) {
    qualityIssues.push(QUALITY_ISSUES.MISSING_LATENCY);
  } else {
    const rawNum = parseFloat(rawLatencyStr);
    if (isNaN(rawNum)) {
      qualityIssues.push(QUALITY_ISSUES.MISSING_LATENCY);
    } else if (rawNum < 0) {
      qualityIssues.push(QUALITY_ISSUES.NEGATIVE_LATENCY);
    } else {
      // Convert units
      if (unit === 's') {
        latencyMs = Math.round(rawNum * 1000);
      } else {
        latencyMs = Math.round(rawNum);
      }
    }
  }

  return {
    service: rawRow.service_id,
    timestamp_utc: timestampUtc,
    status_code: isNaN(statusCode) ? 0 : statusCode,
    latency_ms: latencyMs,
    agent: rawRow.agent,
    region: rawRow.region,
    is_valid: isValid ? 1 : 0,
    quality_issue: qualityIssues.length > 0 ? qualityIssues.join(',') : null
  };
}

module.exports = {
  parseToUtcDateTime,
  isValidHttpStatusCode,
  cleanRow
};
