import React from 'react';

export default function Header({ dbStatus, theme, onToggleTheme }) {
  return (
    <header className="header">
      <div className="brand-title">
        <div className="brand-logo-icon">
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1>EarthRe SLA Dashboard</h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multi-Service SLA Monitoring & Quality Analytics</div>
        </div>
        <span className="badge-sla">Target: 99.9%</span>
      </div>

      <div className="header-right">
        {/* Theme Toggle Button */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          <span>{theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
        </button>

        {/* Database Health Badge */}
        <div className="header-status">
          <span
            className="status-dot"
            style={{
              background: dbStatus === 'connected' ? '#34d399' : '#f87171'
            }}
          />
          <span>Database: {dbStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </header>
  );
}
