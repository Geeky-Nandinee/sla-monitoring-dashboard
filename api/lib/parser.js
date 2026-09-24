const Papa = require('papaparse');
const { REQUIRED_CSV_COLUMNS } = require('./constants');
const { validateRawRow } = require('./validator');
const { cleanRow } = require('./cleaner');

/**
 * Parses and processes a CSV string/buffer into validated, cleaned monitoring records.
 */
function parseAndCleanCsv(csvContent) {
  if (!csvContent || typeof csvContent !== 'string' || csvContent.trim().length === 0) {
    throw new Error('CSV file content is empty.');
  }

  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: header => header.trim()
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    // Check if error is critical
    const fatalError = parseResult.errors.find(e => e.code === 'UndetectableDelimiter' || e.code === 'TooFewFields');
    if (fatalError) {
      throw new Error(`CSV parsing error: ${fatalError.message}`);
    }
  }

  const fields = parseResult.meta.fields || [];
  const missingColumns = REQUIRED_CSV_COLUMNS.filter(col => !fields.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(`CSV is missing required header columns: ${missingColumns.join(', ')}`);
  }

  const rawRows = parseResult.data;
  let totalRows = rawRows.length;
  let validRowsCount = 0;
  let invalidRowsCount = 0;
  let duplicateRowsCount = 0;

  const seenRowSignatures = new Set();
  const cleanedRows = [];

  for (const raw of rawRows) {
    // Exact duplicate row detection based on raw CSV line values
    const signature = `${raw.service_id}|${raw.service_name}|${raw.timestamp}|${raw.status_code}|${raw.latency}|${raw.latency_unit}|${raw.agent}|${raw.region}`;
    
    if (seenRowSignatures.has(signature)) {
      duplicateRowsCount++;
      continue; // Skip exact duplicate
    }
    seenRowSignatures.add(signature);

    // Validate structure via Zod
    const valResult = validateRawRow(raw);
    let rowToClean = raw;
    if (!valResult.success) {
      // Fallback: fill defaults for missing structure fields
      rowToClean = {
        service_id: raw.service_id || 'unknown',
        service_name: raw.service_name || '',
        timestamp: raw.timestamp || '',
        status_code: raw.status_code || '0',
        latency: raw.latency || '',
        latency_unit: raw.latency_unit || 'ms',
        agent: raw.agent || 'unknown',
        region: raw.region || 'unknown'
      };
    }

    const cleaned = cleanRow(rowToClean);

    if (cleaned.is_valid === 1) {
      validRowsCount++;
    } else {
      invalidRowsCount++;
    }

    cleanedRows.push(cleaned);
  }

  return {
    summary: {
      total_rows: totalRows,
      valid_rows: validRowsCount,
      invalid_rows: invalidRowsCount,
      duplicate_rows: duplicateRowsCount
    },
    cleanedRows
  };
}

module.exports = {
  parseAndCleanCsv
};
