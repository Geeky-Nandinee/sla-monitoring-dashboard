import React, { useState } from 'react';
import Pagination from './Pagination';

export default function LogsSection({
  logs,
  pagination,
  availableServices,
  filters,
  onFilterChange,
  onResetFilters,
  onPageChange,
  isLoading,
  error
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activePreset, setActivePreset] = useState('all');

  const handlePresetClick = (preset) => {
    setActivePreset(preset);
    const today = new Date();
    
    if (preset === 'all') {
      onFilterChange({ fromDate: '', toDate: '' });
      return;
    }

    // Default dates based on preset calculation relative to sample dataset bounds (May 2025)
    // 30 days dataset is May 2025.
    let days = 7;
    if (preset === '14d') days = 14;
    if (preset === '30d') days = 30;

    // Set sample window target date range
    const to = new Date('2025-05-20');
    const from = new Date('2025-05-20');
    from.setDate(from.getDate() - days);

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    onFilterChange({ fromDate: fromStr, toDate: toStr });
  };

  const getStatusClass = (statusCode, isValid) => {
    if (!isValid) return 'status-pill invalid';
    if (statusCode >= 200 && statusCode < 400) return 'status-pill success';
    return 'status-pill error';
  };

  // Live search filtering
  const filteredLogs = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.service.toLowerCase().includes(term) ||
      log.agent.toLowerCase().includes(term) ||
      log.region.toLowerCase().includes(term) ||
      String(log.status_code).includes(term) ||
      (log.quality_issue && log.quality_issue.toLowerCase().includes(term))
    );
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Health Check Monitoring Logs</h2>
      </div>

      {/* Quick Date Range Preset Bar */}
      <div className="preset-bar">
        <span className="preset-title">Quick Presets:</span>
        <button
          className={`btn-preset ${activePreset === 'all' && !filters.fromDate ? 'active' : ''}`}
          onClick={() => handlePresetClick('all')}
        >
          All Data
        </button>
        <button
          className={`btn-preset ${activePreset === '7d' ? 'active' : ''}`}
          onClick={() => handlePresetClick('7d')}
        >
          7-Day Window
        </button>
        <button
          className={`btn-preset ${activePreset === '14d' ? 'active' : ''}`}
          onClick={() => handlePresetClick('14d')}
        >
          14-Day Window
        </button>
        <button
          className={`btn-preset ${activePreset === '30d' ? 'active' : ''}`}
          onClick={() => handlePresetClick('30d')}
        >
          30-Day Window
        </button>
      </div>

      {/* Filter Controls & Live Search */}
      <div className="logs-controls">
        <div className="form-group">
          <label className="form-label">From Date</label>
          <input
            type="date"
            className="form-input"
            value={filters.fromDate || ''}
            onChange={(e) => {
              setActivePreset('custom');
              onFilterChange({ fromDate: e.target.value });
            }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">To Date</label>
          <input
            type="date"
            className="form-input"
            value={filters.toDate || ''}
            onChange={(e) => {
              setActivePreset('custom');
              onFilterChange({ toDate: e.target.value });
            }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Service Filter</label>
          <select
            className="form-select"
            value={filters.service || 'all'}
            onChange={(e) => onFilterChange({ service: e.target.value })}
          >
            <option value="all">All Services</option>
            {availableServices.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group search-input-wrapper">
          <label className="form-label">Instant Log Search</label>
          <div style={{ position: 'relative' }}>
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search service, agent, region, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', paddingTop: '18px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setActivePreset('all');
              onResetFilters();
            }}
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Loading & Error states */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          Fetching health check records...
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          Error fetching logs: {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredLogs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p style={{ fontWeight: '600' }}>No monitoring check records match your filter</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Try resetting your search query or selecting a different service filter.</p>
        </div>
      )}

      {/* Logs Table */}
      {!isLoading && !error && filteredLogs.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th>Agent</th>
                  <th>Region</th>
                  <th>Quality Indicator</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log.timestamp_utc}
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {log.service}
                    </td>
                    <td>
                      <span className={getStatusClass(log.status_code, log.is_valid)}>
                        {log.status_code === 0 ? 'INVALID' : log.status_code}
                      </span>
                    </td>
                    <td>
                      {log.latency_ms !== null ? (
                        <span>{log.latency_ms} ms</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                      )}
                    </td>
                    <td>
                      <span style={{ padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {log.agent}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {log.region}
                      </span>
                    </td>
                    <td>
                      {log.quality_issue ? (
                        <span className="tag-issue">{log.quality_issue}</span>
                      ) : (
                        <span style={{ color: 'var(--status-met-text)', fontSize: '0.8rem', fontWeight: '600' }}>✓ Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={onPageChange} />
        </>
      )}
    </div>
  );
}
