const fs = require('fs');
const path = require('path');
const { parseAndCleanCsv } = require('../api/lib/parser');

const csvFiles = [
  'monitoring_checks_9d_seed101.csv',
  'monitoring_checks_12d_seed505.csv',
  'monitoring_checks_14d_seed202.csv',
  'monitoring_checks_21d_seed303.csv',
  'monitoring_checks_30d_seed404.csv'
];

console.log('--- Testing CSV Cleaning & Parsing Engine ---\n');

let allPassed = true;

csvFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    const { summary, cleanedRows } = parseAndCleanCsv(content);
    console.log(`✅ File: ${file}`);
    console.log(`   Summary:`, summary);
    console.log(`   Cleaned rows generated: ${cleanedRows.length}`);

    // Verify first row properties
    const first = cleanedRows[0];
    if (!first || !first.service || !first.timestamp_utc || first.status_code === undefined) {
      console.error(`❌ Invalid cleaned row structure in ${file}`);
      allPassed = false;
    }

    // Verify timestamp formatting
    const sampleUtc = cleanedRows.find(r => r.timestamp_utc !== null)?.timestamp_utc;
    if (!sampleUtc || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(sampleUtc)) {
      console.error(`❌ Timestamp format normalization failed in ${file}: sample='${sampleUtc}'`);
      allPassed = false;
    }

    // Verify seconds unit conversion
    const secondLatency = cleanedRows.find(r => r.latency_ms !== null && r.latency_ms > 0);
    if (secondLatency && typeof secondLatency.latency_ms !== 'number') {
      console.error(`❌ Latency ms conversion failed in ${file}`);
      allPassed = false;
    }
  } catch (err) {
    console.error(`❌ Error parsing ${file}:`, err.message);
    allPassed = false;
  }
  console.log('---------------------------------------------------\n');
});

if (allPassed) {
  console.log('🎉 ALL CSV PROCESSING PIPELINE TESTS PASSED!');
} else {
  console.error('❌ SOME TESTS FAILED');
  process.exit(1);
}
