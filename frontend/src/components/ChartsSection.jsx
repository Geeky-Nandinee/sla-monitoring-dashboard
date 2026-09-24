import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

const CustomTooltip = ({ active, payload, label, theme }) => {
  if (active && payload && payload.length) {
    const isDark = theme === 'dark';
    return (
      <div style={{
        background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        fontSize: '0.85rem'
      }}>
        <p style={{ fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a', marginBottom: '6px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color || (isDark ? '#cbd5e1' : '#334155'), margin: '2px 0' }}>
            {entry.name}: <strong>{entry.value} {entry.unit || ''}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartsSection({ stats, theme = 'dark' }) {
  if (!stats || !stats.by_service || stats.by_service.length === 0) {
    return null;
  }

  const { overall, by_service } = stats;
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#64748b' : '#475569';

  // Data for Availability Bar Chart
  const availabilityData = by_service.map(s => ({
    name: s.service,
    availability: s.availability_pct,
    fill: s.availability_pct >= 99.9 ? '#10b981' : '#ef4444'
  }));

  // Data for Latency Chart
  const latencyData = by_service.map(s => ({
    name: s.service,
    avgLatency: s.avg_latency_ms,
    p95Latency: Math.round(s.avg_latency_ms * 1.35)
  }));

  // Data for Status Donut Chart
  const pieData = [
    { name: 'Successful Checks (2xx/3xx)', value: overall.valid_checks - overall.failed_checks },
    { name: 'Failed Checks (4xx/5xx)', value: overall.failed_checks },
    { name: 'Invalid Checks', value: overall.total_checks - overall.valid_checks }
  ].filter(d => d.value > 0);

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📊 Visual Performance Analytics</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Chart 1: Availability vs SLA Target */}
        <div style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Service Availability (%) vs 99.9% Target
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={availabilityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} />
                <YAxis domain={[95, 100]} stroke={axisColor} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <ReferenceLine y={99.9} label={{ value: '99.9% Target', fill: '#ef4444', fontSize: 11, position: 'top' }} stroke="#ef4444" strokeDasharray="4 4" />
                <Bar dataKey="availability" name="Availability %" radius={[6, 6, 0, 0]}>
                  {availabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Latency Performance */}
        <div style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Response Latency (ms) by Service
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="avgLatency" name="Avg Latency (ms)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="p95Latency" name="Est. P95 Latency (ms)" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Health Checks Distribution */}
        <div style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Check Outcome Distribution
          </h3>
          <div style={{ width: '100%', height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
