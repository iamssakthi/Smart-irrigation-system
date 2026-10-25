import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History as HistoryIcon,
  Download,
  Trash2,
  Filter,
  RefreshCw,
  Calendar,
  Layers,
  Inbox,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { useSystem } from '../context/SystemContext';
import { api } from '../api/client';
import SimulationBanner from '../components/SimulationBanner';
import ConfirmationModal from '../components/ConfirmationModal';

export default function History() {
  const { status, clearHistory, refreshTrigger, notify } = useSystem();

  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Filters
  const [limit, setLimit] = useState(50);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [soilFilter, setSoilFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '1h', '24h', 'today'

  const dryThreshold = status.dry_threshold || 35;
  const wetThreshold = status.wet_threshold || 45;

  // Fetch readings with query params
  const loadHistoryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { limit };
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (soilFilter !== 'all') params.soil_status = soilFilter;

      // Handle time filters
      const now = new Date();
      if (timeFilter === '1h') {
        params.start_date = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      } else if (timeFilter === '24h') {
        params.start_date = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      } else if (timeFilter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        params.start_date = startOfDay.toISOString();
      }

      const res = await api.getReadings(params);
      setReadings(res.readings || []);
    } catch (err) {
      notify(`Failed to fetch historical readings: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [limit, sourceFilter, soilFilter, timeFilter, notify]);

  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData, refreshTrigger]);

  // Handle Clear History
  const handleConfirmClear = async (target) => {
    setIsDeleting(true);
    try {
      await clearHistory(target);
      setIsClearModalOpen(false);
      await loadHistoryData();
    } catch (err) {
      // handled in context
    } finally {
      setIsDeleting(false);
    }
  };

  // Prepare chronological chart series (oldest -> newest)
  const chartSeries = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return sorted.map((r) => {
      const d = new Date(r.timestamp);
      return {
        id: r.id,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: d.toLocaleDateString(),
        moisture: Number(Number(r.soil_moisture).toFixed(1)),
        pump: r.pump_status === 'ON' ? 1 : 0,
        pumpStatus: r.pump_status,
        soilStatus: r.soil_status,
      };
    });
  }, [readings]);

  // Export to CSV
  const handleExportCSV = () => {
    if (readings.length === 0) {
      notify('No records available to export.', 'error');
      return;
    }

    const headers = ['ID', 'Timestamp', 'Device ID', 'Moisture (%)', 'Soil Condition', 'Pump Status', 'Operating Mode', 'Data Source'];
    const rows = readings.map((r) => [
      r.id,
      `"${r.timestamp}"`,
      `"${r.device_id || 'simulated-device'}"`,
      r.soil_moisture,
      `"${r.soil_status}"`,
      `"${r.pump_status}"`,
      `"${r.operating_mode}"`,
      `"${r.source}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `terrasense_iq_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Exported ${readings.length} records to CSV.`, 'success');
  };

  return (
    <div>
      <SimulationBanner />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ts-text-primary)' }}>
            History & Analytics
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--ts-text-secondary)', marginTop: 2 }}>
            Analyze historical soil moisture trends, pump actuation records, and telemetry logs.
          </p>
        </div>

        {/* Top actions: Export CSV + Clear History */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={readings.length === 0}
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            type="button"
            className="btn btn-outline-destructive"
            onClick={() => setIsClearModalOpen(true)}
            title="Clear historical records"
          >
            <Trash2 size={14} /> Clear History
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="panel" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} color="var(--ts-text-muted)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ts-text-primary)' }}>Filters:</span>
            </div>

            {/* Time Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--ts-text-secondary)' }}>Range:</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="form-select"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              >
                <option value="all">All Available History</option>
                <option value="1h">Last 1 Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="today">Today Only</option>
              </select>
            </div>

            {/* Soil Condition Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--ts-text-secondary)' }}>Condition:</span>
              <select
                value={soilFilter}
                onChange={(e) => setSoilFilter(e.target.value)}
                className="form-select"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              >
                <option value="all">All Soil Conditions</option>
                <option value="DRY">Dry Soil (&lt; {dryThreshold}%)</option>
                <option value="TRANSITION">Transition Band</option>
                <option value="ADEQUATE">Adequate Moisture (&ge; {wetThreshold}%)</option>
              </select>
            </div>

            {/* Source Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--ts-text-secondary)' }}>Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="form-select"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              >
                <option value="all">All Sources</option>
                <option value="dashboard_simulation">Dashboard Simulation</option>
                <option value="dashboard_slider">Dashboard Slider</option>
                <option value="virtual_field_lab">Virtual Field Lab</option>
                <option value="auto_field_cycle">Auto Cycle</option>
                <option value="wokwi_esp32">Wokwi ESP32</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Limit selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--ts-text-secondary)' }}>Rows:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="form-select"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              onClick={loadHistoryData}
              title="Refresh records"
              disabled={isLoading}
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Historical Trend Chart */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <HistoryIcon size={18} color="var(--ts-primary)" /> Chronological Telemetry Trend
            </h3>
            <p className="panel-subtitle">
              Visualizing filtered moisture readings with dual hysteresis thresholds
            </p>
          </div>
          <span className="badge badge-gray">{chartSeries.length} Data Points</span>
        </div>

        <div className="chart-container-wrapper">
          {chartSeries.length === 0 ? (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">
                <Inbox size={24} />
              </div>
              <p className="empty-state-title">No historical records match filter</p>
              <p className="empty-state-desc">
                Try widening your date range or condition filters, or use the Virtual Field Lab to generate readings.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
              <LineChart data={chartSeries} margin={{ top: 15, right: 25, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ts-border-subtle)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="var(--ts-text-muted)"
                  fontSize={11}
                  tickLine={false}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="var(--ts-text-muted)"
                  fontSize={11}
                  domain={[0, 100]}
                  ticks={[0, 20, 35, 45, 60, 80, 100]}
                  unit="%"
                  tickLine={false}
                  dx={-5}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="ts-chart-tooltip">
                          <div className="ts-chart-tooltip-header">
                            {data.date} {label}
                          </div>
                          <div className="ts-chart-tooltip-row">
                            <span style={{ color: 'var(--ts-primary)', fontWeight: 600 }}>Moisture:</span>
                            <strong>{data.moisture}%</strong>
                          </div>
                          <div className="ts-chart-tooltip-row">
                            <span style={{ color: 'var(--ts-text-secondary)' }}>Condition:</span>
                            <span>{data.soilStatus}</span>
                          </div>
                          <div className="ts-chart-tooltip-row">
                            <span style={{ color: 'var(--ts-text-secondary)' }}>Pump:</span>
                            <strong style={{ color: data.pumpStatus === 'ON' ? 'var(--ts-info)' : 'var(--ts-text-muted)' }}>
                              {data.pumpStatus}
                            </strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
                />

                <ReferenceLine
                  y={dryThreshold}
                  stroke="#C64545"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: `Dry Trigger (${dryThreshold}%)`,
                    fill: '#C64545',
                    position: 'insideTopLeft',
                    fontSize: 11,
                  }}
                />

                <ReferenceLine
                  y={wetThreshold}
                  stroke="#176B4D"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: `Adequate (${wetThreshold}%)`,
                    fill: '#176B4D',
                    position: 'insideBottomLeft',
                    fontSize: 11,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="moisture"
                  name="Soil Moisture (%)"
                  stroke="#176B4D"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2E8B62', strokeWidth: 1 }}
                  activeDot={{ r: 6, fill: '#176B4D' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Historical Telemetry Table */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <FileSpreadsheet size={18} color="var(--ts-primary)" /> Sensor Telemetry Records
            </h3>
            <p className="panel-subtitle">Sorted chronologically descending (most recent first)</p>
          </div>
          <span className="badge badge-gray">{readings.length} Records</span>
        </div>

        {readings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox size={24} />
            </div>
            <p className="empty-state-title">No sensor readings found</p>
            <p className="empty-state-desc">
              No historical data points match your filter criteria. Try resetting filters or injecting simulated values.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Data Source</th>
                  <th>Moisture</th>
                  <th>Soil Condition</th>
                  <th>Pump State</th>
                  <th>Operating Mode</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--ts-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{r.id}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                        {r.source || 'simulated'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--ts-text-primary)' }}>
                      {Number(r.soil_moisture).toFixed(1)}%
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.soil_status === 'DRY'
                            ? 'badge-red'
                            : r.soil_status === 'ADEQUATE'
                            ? 'badge-green'
                            : 'badge-amber'
                        }`}
                      >
                        {r.soil_status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.pump_status === 'ON' ? 'badge-blue' : 'badge-gray'}`}>
                        {r.pump_status}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                        {r.operating_mode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Clear History Confirmation Modal */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear Historical Data"
        isDeleting={isDeleting}
        showTargetOptions={true}
      />
    </div>
  );
}
