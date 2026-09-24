import React, { useState } from 'react';

export default function StatsSection({ stats, selectedService, onSelectService, isLoading, error }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          Calculating real-time SLA metrics from MySQL database...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">
          Error loading stats: {error}
        </div>
      </div>
    );
  }

  if (!stats || !stats.overall) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          No monitoring data loaded. Upload a health check CSV file above to evaluate SLA performance.
        </div>
      </div>
    );
  }

  const { overall, by_service } = stats;

  return (
    <div className="card">
      <div className="stats-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="stats-title">
          <span>⚡ SLA Performance Overview</span>
          <span className={`stat-badge ${overall.sla_status === 'Met' ? 'met' : 'breached'}`}>
            SLA {overall.sla_status} ({overall.availability_pct}%)
          </span>
        </div>
        <button className="toggle-btn" aria-label="Toggle Stats">
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Availability / Target</div>
              <div className="stat-value">{overall.availability_pct}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Target: {overall.sla_target_pct}%
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">SLA Compliance</div>
              <div className="stat-value">
                <span className={`stat-badge ${overall.sla_status === 'Met' ? 'met' : 'breached'}`} style={{ fontSize: '1rem', padding: '4px 12px' }}>
                  {overall.sla_status}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {overall.failed_checks.toLocaleString()} failed checks
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Total Health Checks</div>
              <div className="stat-value">{overall.total_checks.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {overall.valid_checks.toLocaleString()} valid checks
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Average Latency</div>
              <div className="stat-value">{overall.avg_latency_ms} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ms</span></div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                P95: {overall.p95_latency_ms} ms
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Quality Issues Flagged</div>
              <div className="stat-value" style={{ color: overall.data_quality_issues > 0 ? 'var(--warning-text)' : 'inherit' }}>
                {overall.data_quality_issues}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Anomaly records flagged
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Monitored Infrastructure</div>
              <div className="stat-value">{overall.total_services} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Services</span></div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Reported by {overall.total_agents} agents
              </div>
            </div>
          </div>

          {by_service && by_service.length > 0 && (
            <div className="services-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  Per-Service SLA Breakdown <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>(Click card to filter dashboard)</span>
                </div>
                {selectedService && selectedService !== 'all' && (
                  <button
                    className="btn-preset active"
                    onClick={() => onSelectService('all')}
                    style={{ fontSize: '0.75rem', padding: '2px 10px' }}
                  >
                    Clear Filter ({selectedService}) ×
                  </button>
                )}
              </div>

              <div className="services-grid">
                {by_service.map(svc => {
                  const isSelected = selectedService === svc.service;
                  return (
                    <div
                      key={svc.service}
                      className={`service-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => onSelectService(isSelected ? 'all' : svc.service)}
                      title="Click to filter dashboard for this service"
                    >
                      <div className="service-name">
                        <span>{svc.service}</span>
                        <span className={`status-pill ${svc.sla_status === 'Met' ? 'success' : 'error'}`}>
                          {svc.availability_pct}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Avg: {svc.avg_latency_ms} ms | Failed: {svc.failed_checks} / {svc.total_checks}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
