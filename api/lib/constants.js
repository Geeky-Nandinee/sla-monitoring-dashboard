module.exports = {
  SLA_TARGET_PERCENT: 99.9,
  REQUIRED_CSV_COLUMNS: [
    'service_id',
    'service_name',
    'timestamp',
    'status_code',
    'latency',
    'latency_unit',
    'agent',
    'region'
  ],
  QUALITY_ISSUES: {
    MISSING_LATENCY: 'MISSING_LATENCY',
    NEGATIVE_LATENCY: 'NEGATIVE_LATENCY',
    INVALID_STATUS_CODE: 'INVALID_STATUS_CODE',
    INVALID_TIMESTAMP: 'INVALID_TIMESTAMP',
    DUPLICATE_ROW: 'DUPLICATE_ROW'
  }
};
