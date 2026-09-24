# SLA Monitoring Dashboard — EarthRe Take-Home Assignment

Single-screen SLA Monitoring Dashboard built for EarthRe. Parses multi-day health-check CSV logs, cleans data in a stateless serverless function, persists clean records to MySQL, and displays real-time SLA statistics and filterable monitoring logs.

---

## 1. Architecture

### System Flow
`React UI` ➔ `Serverless Function (/api/upload.js)` ➔ `MySQL Database` ➔ `Dashboard UI`

1. **Upload UI**: React drag-and-drop component for health check CSV uploads.
2. **Stateless Serverless Function**: Deployed Node.js serverless functions under `/api` (`upload.js`, `stats.js`, `logs.js`, `health.js`). Handles streaming CSV parsing (`PapaParse`), schema validation (`Zod`), normalization, and row deduplication.
3. **Database Persistence**: MySQL database (`sla_monitoring`) storing `uploads` metadata and cleaned `monitoring_checks` within ACID transactions.
4. **Dashboard UI**: Single-screen React dashboard with collapsible SLA stats, visual charts (`Recharts`), filterable logs, and Dark/Light mode switcher.

### Tech Stack Rationale
- **Frontend**: React + Vite (Fast builds, clean component modularity, zero framework bloat).
- **Backend API**: Node.js Serverless Functions (Stateless execution, compatible with Vercel/Netlify).
- **Database**: MySQL (`mysql2` pool) for indexed range queries and fast SQL aggregations (`AVG`, `COUNT`, `SUM`).
- **CSV Processing**: PapaParse (stream-friendly CSV parser) + Zod (schema validation).

---

## 2. Data Quality Findings & Handling Strategy

Empirical inspection across sample datasets (`9d`, `12d`, `14d`, `21d`, `30d`) identified 6 data-quality issues:

| Data-Quality Issue | Observed Pattern | Handling Strategy |
| :--- | :--- | :--- |
| **Mixed Timestamps** | ISO 8601 (`2025-05-13T12:45:00Z`) vs 10-digit Unix Epoch (`1746938700`) | Normalized all timestamps to UTC `YYYY-MM-DD HH:mm:ss`. Marked `INVALID_TIMESTAMP` if unparseable. |
| **Mixed Latency Units** | Milliseconds (`707 ms`) vs Seconds (`0.717 s`) | Converted seconds (`s`) to milliseconds (`Math.round(sec * 1000)`), stored as integer `latency_ms`. |
| **Missing Latency** | Empty values (`,ms,`) | Stored `latency_ms = NULL`. Record preserved as valid check with quality tag `MISSING_LATENCY`. |
| **Negative Latency** | Negative values (`-50 ms`) | Stored `latency_ms = NULL`. Tagged `NEGATIVE_LATENCY`. |
| **Invalid HTTP Status** | Non-standard status code `999` | Marked `is_valid = 0`, tagged `INVALID_STATUS_CODE`. **Excluded from SLA availability calculation denominator.** |
| **Exact Duplicate Rows** | Identical rows across agents | Deduplicated during parsing based on raw row signature. Tracked in `uploads.duplicate_rows`. |

---

## 3. Assumptions & Choice of Statistics

### SLA Availability Formula
$$\text{Availability } (\%) = \left( \frac{\text{Successful Checks (2xx \& 3xx)}}{\text{Total Valid Checks}} \right) \times 100$$

- **Denominator Rule**: Only valid HTTP status codes (2xx–5xx) are included in the denominator. Non-standard codes (e.g. `999`) are excluded.
- **SLA Target**: **99.9%**.
- **SLA Status**: `"Met"` if Availability $\ge 99.9\%$, `"Breached"` if Availability $< 99.9\%$.
- **Windowed Measurement**: Multi-day log datasets represent sample time windows (e.g. 9–30 days). Availability is evaluated over the selected window.

### Choice of Dashboard Statistics
- **Overall SLA Status & Availability %**: Primary metric for on-call engineers and billing credit calculations.
- **Per-Service Breakdown**: Identifies specific microservices causing SLA breaches.
- **P95 Latency**: Highlights worst-case latency spikes affecting top 5% slowest requests.
- **Data Quality Issues Count**: Provides visibility into raw data anomalies detected during serverless ingestion.

---

## 4. Local Setup, Live URL & Redeployment

### Prerequisites
- Node.js (>= 18.0.0)
- MySQL Server

### Environment Setup
Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

### Initialize Database & Run Pipeline Tests
```bash
npm install
npm run init-db
npm run test-pipeline
```

### Run Local Development Server
Start API server (port 3001) and React app (port 3000) concurrently:
```bash
npm run dev
```

### Cloud Deployment (Vercel)
1. Push repository to GitHub and import into Vercel.
2. Set Environment Variables (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_SSL`).
3. Vercel automatically deploys static frontend assets and `/api/*.js` serverless functions.

- **Live URL**: `https://sla-monitoring-dashboard-earthre.vercel.app` *(Placeholder)*

### Free-Tier Redeployment / Recovery
If free-tier database hosting expires:
1. Create a new MySQL instance (PlanetScale, Aiven, or Railway).
2. Point `.env` to new host and run `npm run init-db`.
3. Update Vercel environment variables and redeploy via `git push`.

---

## 5. What Would Be Improved With More Time

1. **Automated Incident Alerts**: Webhook notifications (Slack/Teams) when availability drops below 99.9%.
2. **Multi-Dataset Comparison**: Side-by-side trend analysis across multiple CSV uploads.
3. **Export SLA Reports**: One-click PDF/CSV export of SLA calculation summaries for billing audits.
4. **Time-Series Latency Charts**: Interactive timeline charting latency spikes over time.
