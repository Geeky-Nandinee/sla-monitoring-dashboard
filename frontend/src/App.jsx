import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import StatsSection from './components/StatsSection';
import ChartsSection from './components/ChartsSection';
import LogsSection from './components/LogsSection';
import { fetchStats, fetchLogs, fetchHealth } from './services/api';

export default function App() {
  const [dbStatus, setDbStatus] = useState('unknown');

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Logs state
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    service: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Check health on mount
  useEffect(() => {
    fetchHealth().then(res => {
      setDbStatus(res.database || 'disconnected');
    });
  }, []);

  // Load SLA Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchStats(filters);
      setStats(data);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, [filters]);

  // Load Logs
  const loadLogs = useCallback(async (page = 1) => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = await fetchLogs({
        ...filters,
        page,
        limit: 50
      });
      setLogs(res.logs || []);
      setPagination(res.pagination || null);
      if (res.available_services && res.available_services.length > 0) {
        setAvailableServices(res.available_services);
      }
    } catch (err) {
      setLogsError(err.message);
    } finally {
      setLogsLoading(false);
    }
  }, [filters]);

  // Trigger data fetching on filter or page change
  useEffect(() => {
    loadStats();
    loadLogs(currentPage);
  }, [loadStats, loadLogs, currentPage]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      service: 'all'
    });
    setCurrentPage(1);
  };

  const handleUploadSuccess = () => {
    fetchHealth().then(res => setDbStatus(res.database || 'disconnected'));
    setCurrentPage(1);
    loadStats();
    loadLogs(1);
  };

  return (
    <div className="app-container">
      <Header
        dbStatus={dbStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main>
        {/* CSV Upload Section */}
        <UploadSection onUploadSuccess={handleUploadSuccess} />

        {/* Top SLA Statistics Section (Collapsible & Interactive Click-to-filter) */}
        <StatsSection
          stats={stats}
          selectedService={filters.service}
          onSelectService={(svc) => handleFilterChange({ service: svc })}
          isLoading={statsLoading}
          error={statsError}
        />

        {/* Visual Charts & Analytics Section */}
        <ChartsSection stats={stats} theme={theme} />

        {/* Filterable Monitoring Logs View */}
        <LogsSection
          logs={logs}
          pagination={pagination}
          availableServices={availableServices}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onPageChange={(page) => setCurrentPage(page)}
          isLoading={logsLoading}
          error={logsError}
        />
      </main>
    </div>
  );
}
