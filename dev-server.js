require('dotenv').config();
const http = require('http');
const url = require('url');

const healthHandler = require('./api/health');
const statsHandler = require('./api/stats');
const logsHandler = require('./api/logs');
const uploadHandler = require('./api/upload');

const PORT = parseInt(process.env.PORT || '3001', 10);

/**
 * Enhances native Node.js http.ServerResponse with Express/Vercel-like status() and json() methods.
 */
function enhanceResponse(res) {
  res.status = function(statusCode) {
    this.statusCode = statusCode;
    return this;
  };
  res.json = function(data) {
    if (!this.headersSent) {
      this.setHeader('Content-Type', 'application/json');
    }
    this.end(JSON.stringify(data));
    return this;
  };
  return res;
}

const server = http.createServer((req, res) => {
  enhanceResponse(res);
  const parsedUrl = url.parse(req.url, true);
  req.query = parsedUrl.query || {};
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/health') {
    return healthHandler(req, res);
  } else if (pathname === '/api/stats') {
    return statsHandler(req, res);
  } else if (pathname === '/api/logs') {
    return logsHandler(req, res);
  } else if (pathname === '/api/upload') {
    return uploadHandler(req, res);
  } else {
    return res.status(404).json({ error: 'Endpoint Not Found' });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 SLA Local Server running at http://localhost:${PORT}`);
});
