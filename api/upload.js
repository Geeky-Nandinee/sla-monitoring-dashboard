const Busboy = require('busboy');
const { parseAndCleanCsv } = require('./lib/parser');
const { executeTransaction } = require('./lib/db');

// Max upload size limit (10MB)
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Extracts raw CSV file content string from incoming HTTP request (supports multipart form-data & raw text/body).
 */
function extractCsvFromRequest(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      let fileBuffer = Buffer.alloc(0);
      let filename = 'uploaded_file.csv';
      let fileReceived = false;

      let busboy;
      try {
        busboy = Busboy({
          headers: req.headers,
          limits: { fileSize: MAX_FILE_SIZE_BYTES }
        });
      } catch (err) {
        return reject(new Error(`Failed to initialize form parser: ${err.message}`));
      }

      busboy.on('file', (fieldname, fileStream, info) => {
        filename = info.filename || filename;
        fileReceived = true;

        fileStream.on('data', data => {
          if (fileBuffer.length + data.length > MAX_FILE_SIZE_BYTES) {
            fileStream.resume(); // Drain stream
            return reject(new Error('File size exceeds maximum allowed limit (10MB).'));
          }
          fileBuffer = Buffer.concat([fileBuffer, data]);
        });

        fileStream.on('limit', () => {
          reject(new Error('File size exceeds maximum allowed limit (10MB).'));
        });
      });

      busboy.on('finish', () => {
        if (!fileReceived || fileBuffer.length === 0) {
          return reject(new Error('No CSV file found in form data upload.'));
        }
        resolve({
          filename,
          content: fileBuffer.toString('utf-8')
        });
      });

      busboy.on('error', err => reject(err));

      if (req.rawBody) {
        busboy.end(req.rawBody);
      } else {
        req.pipe(busboy);
      }
    } else {
      // Direct raw text or body upload fallback
      let rawData = '';
      req.on('data', chunk => {
        rawData += chunk.toString('utf-8');
        if (rawData.length > MAX_FILE_SIZE_BYTES) {
          reject(new Error('Payload size exceeds maximum allowed limit (10MB).'));
        }
      });
      req.on('end', () => {
        if (!rawData || rawData.trim().length === 0) {
          return reject(new Error('Upload payload is empty. Please provide a valid CSV file.'));
        }
        resolve({
          filename: 'raw_upload.csv',
          content: rawData
        });
      });
      req.on('error', err => reject(err));
    }
  });
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { filename, content } = await extractCsvFromRequest(req);

    // 1. Parse and clean CSV content
    const { summary, cleanedRows } = parseAndCleanCsv(content);

    // 2. Persist to MySQL inside a Database Transaction
    const uploadId = await executeTransaction(async conn => {
      // Insert upload metadata
      const [uploadResult] = await conn.query(
        `INSERT INTO uploads (filename, total_rows, valid_rows, invalid_rows, duplicate_rows, status)
         VALUES (?, ?, ?, ?, ?, 'processing')`,
        [filename, summary.total_rows, summary.valid_rows, summary.invalid_rows, summary.duplicate_rows]
      );
      const insertedUploadId = uploadResult.insertId;

      // Batch insert cleaned records in chunks of 500
      const BATCH_SIZE = 500;
      for (let i = 0; i < cleanedRows.length; i += BATCH_SIZE) {
        const chunk = cleanedRows.slice(i, i + BATCH_SIZE);
        const insertValues = chunk.map(r => [
          insertedUploadId,
          r.timestamp_utc,
          r.service,
          r.status_code,
          r.latency_ms,
          r.agent,
          r.region,
          r.is_valid,
          r.quality_issue
        ]);

        await conn.query(
          `INSERT INTO monitoring_checks
            (upload_id, timestamp_utc, service, status_code, latency_ms, agent, region, is_valid, quality_issue)
           VALUES ?`,
          [insertValues]
        );
      }

      // Mark upload status completed
      await conn.query(`UPDATE uploads SET status = 'completed' WHERE id = ?`, [insertedUploadId]);

      return insertedUploadId;
    });

    return res.status(200).json({
      success: true,
      message: 'CSV file processed and persisted successfully.',
      data: {
        upload_id: uploadId,
        filename,
        summary
      }
    });
  } catch (err) {
    console.error('Upload Endpoint Error:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'An error occurred while processing the CSV file.'
    });
  }
};
