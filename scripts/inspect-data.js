const fs = require('fs');
const path = require('path');

const csvFiles = [
  'monitoring_checks_9d_seed101.csv',
  'monitoring_checks_12d_seed505.csv',
  'monitoring_checks_14d_seed202.csv',
  'monitoring_checks_21d_seed303.csv',
  'monitoring_checks_30d_seed404.csv'
];

const dir = __dirname + '/..';

console.log('--- Inspecting CSV Datasets ---\n');

csvFiles.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  
  if (lines.length === 0) {
    console.log(`${file}: Empty file`);
    return;
  }

  const header = lines[0].split(',');
  const rows = lines.slice(1);

  let totalRows = rows.length;
  let isoTimestamps = 0;
  let unixTimestamps = 0;
  let invalidTimestamps = 0;
  let msUnits = 0;
  let sUnits = 0;
  let otherUnits = 0;
  let missingLatency = 0;
  let negativeLatency = 0;
  let statusCodes = {};
  let services = new Set();
  let agents = new Set();
  let regions = new Set();
  let duplicateCount = 0;

  const seenRows = new Set();

  rows.forEach(line => {
    if (seenRows.has(line)) {
      duplicateCount++;
    } else {
      seenRows.add(line);
    }

    const cols = line.split(',');
    // service_id,service_name,timestamp,status_code,latency,latency_unit,agent,region
    const [svcId, svcName, ts, status, latency, unit, agent, region] = cols;

    services.add(svcId);
    if (agent) agents.add(agent);
    if (region) regions.add(region);

    // Timestamp check
    if (/^\d{4}-\d{2}-\d{2}T/.test(ts)) {
      isoTimestamps++;
    } else if (/^\d+$/.test(ts)) {
      unixTimestamps++;
    } else {
      invalidTimestamps++;
    }

    // Status code check
    statusCodes[status] = (statusCodes[status] || 0) + 1;

    // Latency check
    if (unit === 'ms') msUnits++;
    else if (unit === 's') sUnits++;
    else otherUnits++;

    if (latency === '' || latency === undefined || latency === null) {
      missingLatency++;
    } else {
      const numLat = parseFloat(latency);
      if (isNaN(numLat)) {
        missingLatency++;
      } else if (numLat < 0) {
        negativeLatency++;
      }
    }
  });

  console.log(`File: ${file}`);
  console.log(`  Header: ${header.join(', ')}`);
  console.log(`  Total rows: ${totalRows}`);
  console.log(`  Services (${services.size}): ${Array.from(services).join(', ')}`);
  console.log(`  Agents (${agents.size}): ${Array.from(agents).join(', ')}`);
  console.log(`  Regions (${regions.size}): ${Array.from(regions).join(', ')}`);
  console.log(`  Timestamps: ${isoTimestamps} ISO, ${unixTimestamps} Unix, ${invalidTimestamps} Invalid`);
  console.log(`  Latency Units: ${msUnits} ms, ${sUnits} s, ${otherUnits} other/missing`);
  console.log(`  Latency Issues: ${missingLatency} missing, ${negativeLatency} negative`);
  console.log(`  Status codes:`, statusCodes);
  console.log(`  Exact Duplicate Rows: ${duplicateCount}`);
  console.log('---------------------------------------------------\n');
});
