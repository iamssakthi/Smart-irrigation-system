import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Droplets,
  Activity,
  Power,
  Sliders,
  Clock,
  Cpu,
  RefreshCw,
  Inbox,
  ArrowUpRight,
  ArrowDownRight,
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
import MetricCard from '../components/MetricCard';

export default function Overview() {
  const { status, switchMode, controlPump, simulateMoisture, refreshTrigger, notify } = useSystem();

  const [sliderValue, setSliderValue] = useState(Math.round(status.moisture || 50));
  const [readings, setReadings] = useState([]);
  const [events, setEvents] = useState([]);
  const [chartLimit, setChartLimit] = useState(30);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync slider when status updates from outside
  useEffect(() => {
    setSliderValue(Math.round(status.moisture || 50));
  }, [status.moisture]);

  // Fetch recent readings and events
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [readingsRes, eventsRes] = await Promise.all([
        api.getReadings({ limit: chartLimit }),
        api.getEvents({ limit: 6 }),
      ]);
      setReadings(readingsRes.readings || []);
      setEvents(eventsRes.events || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [chartLimit]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshTrigger]);

  const handleSliderChange = (val) => {
    setSliderValue(val);
  };

  const handleSliderCommit = async () => {
    try {
      setIsSubmitting(true);
      await simulateMoisture(sliderValue, 'dashboard_slider');
    } catch (err) {
      // notification handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = async (val, presetName) => {
    setSliderValue(val);
    try {
      setIsSubmitting(true);
      await simulateMoisture(val, `preset_${presetName}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare chart series: strictly chronological order (oldest to newest)
  const chartData = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return sorted.map((r) => {
      const d = new Date(r.timestamp);
      return {
        id: r.id,
        rawTimestamp: r.timestamp,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        moisture: Number(Number(r.soil_moisture).toFixed(1)),
        pump: r.pump_status === 'ON' ? 100 : 0,
        pumpStatus: r.pump_status,
        soilStatus: r.soil_status,
      };
    });
  }, [readings]);

  // Previous reading trend calculation
  const moistureTrend = useMemo(() => {
    if (chartData.length < 2) return null;
    const current = chartData[chartData.length - 1].moisture;
    const prev = chartData[chartData.length - 2].moisture;
    const diff = Number((current - prev).toFixed(1));
    return { diff, increased: diff > 0, unchanged: diff === 0 };
  }, [chartData]);

  const dryThreshold = status.dry_threshold || 35;
  const wetThreshold = status.wet_threshold || 45;

  // Dynamic Decision Text generated from actual controller state
  const decisionExplanation = useMemo(() => {
    const moisture = Number(status.moisture || 0);
    if (status.mode === 'MANUAL') {
      return {
        title: 'Manual Control Override Active',
        body: `System is running in MANUAL mode. Automatic hysteresis decision logic is bypassed. Pump is currently ${status.pump_status} due to operator command.`,
        type: 'warning',
      };
    }
    if (moisture < dryThreshold) {
      return {
        title: 'Moisture Below Dry Threshold — Irrigation Active',
        body: `Soil moisture (${moisture.toFixed(1)}%) is below the configured dry trigger (${dryThreshold}%). The controller commanded pump ON to replenish soil moisture.`,
        type: 'error',
      };
    }
    if (moisture >= wetThreshold) {
      return {
        title: 'Adequate Moisture Target Reached — Irrigation Standby',
        body: `Soil moisture (${moisture.toFixed(1)}%) has reached or exceeded the adequate threshold (≥ ${wetThreshold}%). The controller commanded pump OFF to prevent over-saturation.`,
        type: 'success',
      };
    }
    return {
      title: 'Moisture in Transition Band — Maintaining State',
      body: `Soil moisture (${moisture.toFixed(1)}%) is within the hysteresis deadband (${dryThreshold}% to ${wetThreshold}%). The controller retains previous pump state (${status.pump_status}) to prevent mechanical chatter.`,
      type: 'info',
    };
  }, [status.moisture, status.mode, status.pump_status, dryThreshold, wetThreshold]);

  const getSoilConditionBadge = (condition) => {
    if (condition === 'DRY') {
      return <span className="badge badge-red">Dry Soil (Depleted)</span>;
    }
    if (condition === 'ADEQUATE') {
      return <span className="badge badge-green">Adequate (Optimal)</span>;
    }
    return <span className="badge badge-amber">Transition (Deadband)</span>;
  };

  return (
    <div>
      <SimulationBanner />

      {/* Page Heading with simulation subtitle */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ts-text-primary)' }}>
              Overview
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--ts-text-secondary)', marginTop: 2 }}>
              Monitor simulated soil conditions, irrigation decisions, and system activity.
            </p>
          </div>
          <span className="badge badge-gray" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            <Cpu size={13} style={{ marginRight: 4 }} />
            Simulation environment · No physical hardware connected
          </span>
        </div>
      </div>

      {/* Primary Key Metric Cards */}
      <section className="stats-grid" aria-label="System Metrics">
        <MetricCard
          label="Soil Moisture"
          value={`${Number(status.moisture || 0).toFixed(1)}%`}
          icon={Droplets}
          accent={status.moisture < dryThreshold ? 'rose' : status.moisture >= wetThreshold ? 'forest' : 'amber'}
          badge={getSoilConditionBadge(status.soil_status)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span>Dry &lt; {dryThreshold}% | Wet &ge; {wetThreshold}%</span>
              {moistureTrend && !moistureTrend.unchanged && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 600, color: moistureTrend.increased ? 'var(--ts-secondary)' : 'var(--ts-error)' }}>
                  {moistureTrend.increased ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(moistureTrend.diff)}%
                </span>
              )}
            </div>
          }
        />

        <MetricCard
          label="Irrigation State"
          value={status.pump_status || 'OFF'}
          icon={Power}
          accent={status.pump_status === 'ON' ? 'blue' : 'forest'}
          badge={
            status.pump_status === 'ON' ? (
              <span className="badge badge-blue">
                <span className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--ts-info)' }} />
                Virtual Pump Active
              </span>
            ) : (
              <span className="badge badge-gray">Virtual Pump Standby</span>
            )
          }
          footer={
            <span>
              Engine: {status.mode === 'AUTOMATIC' ? 'Closed-Loop Hysteresis' : 'Manual Override'}
            </span>
          }
        />

        <MetricCard
          label="Controller Mode"
          value={status.mode || 'AUTOMATIC'}
          icon={Sliders}
          accent={status.mode === 'MANUAL' ? 'amber' : 'forest'}
          badge={
            status.mode === 'MANUAL' ? (
              <span className="badge badge-amber">Manual Override Active</span>
            ) : (
              <span className="badge badge-green">Closed-Loop Auto Active</span>
            )
          }
          footer={
            <span>
              {status.mode === 'AUTOMATIC' ? 'Auto-evaluating threshold rules' : 'Manual control commands active'}
            </span>
          }
        />

        <MetricCard
          label="Simulation Health"
          value="ONLINE"
          icon={Cpu}
          accent="forest"
          badge={<span className="badge badge-green">Software Simulation Engine</span>}
          footer={
            <span>
              Last update: {new Date(status.last_updated || Date.now()).toLocaleTimeString()}
            </span>
          }
        />
      </section>

      {/* Controller Decision Explanation Card */}
      <section
        className="panel"
        style={{
          marginBottom: 24,
          borderLeft: `4px solid ${
            decisionExplanation.type === 'error'
              ? 'var(--ts-error)'
              : decisionExplanation.type === 'success'
              ? 'var(--ts-primary)'
              : decisionExplanation.type === 'warning'
              ? 'var(--ts-warning)'
              : 'var(--ts-info)'
          }`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ts-text-muted)' }}>
                Current Irrigation Decision
              </span>
              <span
                className={`badge ${
                  decisionExplanation.type === 'error'
                    ? 'badge-red'
                    : decisionExplanation.type === 'success'
                    ? 'badge-green'
                    : decisionExplanation.type === 'warning'
                    ? 'badge-amber'
                    : 'badge-blue'
                }`}
              >
                {status.pump_status === 'ON' ? 'Pump Commanded ON' : 'Pump Commanded OFF'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ts-text-primary)', marginBottom: 4 }}>
              {decisionExplanation.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ts-text-secondary)', lineHeight: 1.5 }}>
              {decisionExplanation.body}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Controls & Simulator Injection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Quick Simulator Control Card */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Sliders size={18} color="var(--ts-primary)" /> Quick Moisture Injection
              </h3>
              <p className="panel-subtitle">Simulate soil moisture to observe automated controller transitions</p>
            </div>
            <span className="badge badge-green">Virtual Lab</span>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--ts-text-secondary)' }}>Simulated Soil Moisture</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--ts-primary)' }}>
                {sliderValue}%
              </strong>
            </div>

            <div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={sliderValue}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                className="range-slider"
                disabled={isSubmitting}
                aria-label="Simulated Moisture Slider"
              />
            </div>
          </div>

          {/* Quick Scenario Preset Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              onClick={() => handleApplyPreset(22, 'dry')}
              disabled={isSubmitting}
            >
              Dry Soil (22%)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              onClick={() => handleApplyPreset(40, 'transition')}
              disabled={isSubmitting}
            >
              Transition (40%)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              onClick={() => handleApplyPreset(55, 'adequate')}
              disabled={isSubmitting}
            >
              Adequate (55%)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              onClick={() => handleApplyPreset(80, 'very_wet')}
              disabled={isSubmitting}
            >
              Very Wet (80%)
            </button>
          </div>

          {/* Mode switch & Manual Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 14, borderTop: '1px solid var(--ts-border-subtle)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={`btn ${status.mode === 'AUTOMATIC' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                onClick={() => switchMode('AUTOMATIC')}
              >
                Auto Mode
              </button>
              <button
                type="button"
                className={`btn ${status.mode === 'MANUAL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                onClick={() => switchMode('MANUAL')}
              >
                Manual Mode
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  borderColor: status.pump_status === 'ON' ? 'var(--ts-info)' : undefined,
                }}
                disabled={status.mode !== 'MANUAL'}
                onClick={() => controlPump('ON')}
              >
                Pump ON
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                disabled={status.mode !== 'MANUAL'}
                onClick={() => controlPump('OFF')}
              >
                Pump OFF
              </button>
            </div>
          </div>
        </div>

        {/* Hysteresis Thresholds & Logic Model Card */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Activity size={18} color="var(--ts-primary)" /> Hysteresis Decision Model
              </h3>
              <p className="panel-subtitle">Dual-threshold logic preventing rapid actuator cycling</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--ts-error-bg)',
                border: '1px solid var(--ts-error-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <strong style={{ color: 'var(--ts-error)', fontSize: '0.85rem' }}>Dry Trigger Threshold</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--ts-text-secondary)' }}>Moisture below this turns pump ON</p>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ts-error)' }}>{dryThreshold}%</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--ts-bg-subtle-green)',
                border: '1px solid var(--ts-border-green)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <strong style={{ color: 'var(--ts-primary)', fontSize: '0.85rem' }}>Adequate Target Threshold</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--ts-text-secondary)' }}>Moisture reaching this turns pump OFF</p>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ts-primary)' }}>{wetThreshold}%</span>
            </div>

            {/* Deadband explanation */}
            <div
              style={{
                background: 'var(--ts-surface-muted)',
                border: '1px solid var(--ts-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: 'var(--ts-text-secondary)',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: 'var(--ts-text-primary)' }}>Hysteresis Deadband ({dryThreshold}% - {wetThreshold}%): </strong>
              Prevents pump chatter by requiring moisture to fall below {dryThreshold}% to turn on and rise to {wetThreshold}% before turning off.
            </div>
          </div>
        </div>
      </div>

      {/* Main Soil Moisture History Chart with Definitive Layout Fix */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Activity size={18} color="var(--ts-primary)" /> Soil Moisture History Trend
            </h3>
            <p className="panel-subtitle">
              Chronologically sorted telemetry with configured dry trigger and adequate moisture reference lines
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Limit selector */}
            <select
              value={chartLimit}
              onChange={(e) => setChartLimit(Number(e.target.value))}
              className="form-select"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              <option value={15}>Last 15</option>
              <option value={30}>Last 30</option>
              <option value={50}>Last 50</option>
            </select>

            <span className="badge badge-gray">{chartData.length} Readings</span>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              onClick={loadDashboardData}
              title="Refresh telemetry"
              disabled={isLoadingData}
            >
              <RefreshCw size={13} className={isLoadingData ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Explicitly sized responsive chart container preventing layout overflow */}
        <div className="chart-container-wrapper">
          {chartData.length === 0 ? (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">
                <Inbox size={24} />
              </div>
              <p className="empty-state-title">No moisture readings recorded</p>
              <p className="empty-state-desc">
                Adjust the simulated moisture slider above or click a scenario preset to generate telemetry records.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
              <LineChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 20 }}>
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
                            Timestamp: {label}
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
                            <span style={{ color: 'var(--ts-text-secondary)' }}>Pump State:</span>
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

                {/* Dry threshold line */}
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

                {/* Adequate threshold line */}
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

      {/* Bottom Grid: Recent Events and Readings Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Recent Events Card */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Clock size={18} color="var(--ts-primary)" /> Recent Irrigation Events
            </h3>
            <span className="badge badge-gray">Last 6</span>
          </div>

          {events.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 12px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--ts-text-secondary)' }}>No irrigation events recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.slice(0, 6).map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--ts-surface-muted)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Power
                      size={14}
                      color={ev.event_type.includes('on') ? 'var(--ts-info)' : 'var(--ts-secondary)'}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: 'var(--ts-text-primary)' }}>
                        {ev.description}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ts-text-muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Readings Feed */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Activity size={18} color="var(--ts-primary)" /> Recent Telemetry Snapshots
            </h3>
            <span className="badge badge-gray">Latest</span>
          </div>

          {readings.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 12px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--ts-text-secondary)' }}>No telemetry captured yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Moisture</th>
                    <th>Soil Condition</th>
                    <th>Pump</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.slice(0, 5).map((r) => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 600 }}>{Number(r.soil_moisture).toFixed(1)}%</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
