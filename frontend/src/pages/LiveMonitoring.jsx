import React, { useState, useEffect } from 'react';
import {
  Activity,
  Gauge,
  Sliders,
  Cpu,
  Power,
  Play,
  Pause,
  RefreshCw,
  Droplets,
  Radio,
  Clock,
  Wifi,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { api } from '../api/client';
import SimulationBanner from '../components/SimulationBanner';
import MetricCard from '../components/MetricCard';

export default function LiveMonitoring() {
  const {
    status,
    pollingActive,
    setPollingActive,
    pollIntervalMs,
    setPollIntervalMs,
    simulateMoisture,
    refreshTrigger,
  } = useSystem();

  const [sliderVal, setSliderVal] = useState(Math.round(status.moisture || 50));
  const [liveReadings, setLiveReadings] = useState([]);
  const [isInjecting, setIsInjecting] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    setSliderVal(Math.round(status.moisture || 50));
  }, [status.moisture]);

  // Telemetry freshness tracker
  useEffect(() => {
    const updateFreshness = () => {
      const ts = status.reading_timestamp || status.last_updated;
      if (ts) {
        const diff = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
        setSecondsAgo(diff);
      }
    };
    updateFreshness();
    const interval = setInterval(updateFreshness, 1000);
    return () => clearInterval(interval);
  }, [status.reading_timestamp, status.last_updated]);

  // Load telemetry stream
  const fetchLiveTelemetry = async () => {
    try {
      const res = await api.getReadings({ limit: 12 });
      setLiveReadings(res.readings || []);
    } catch (err) {
      console.error('Failed to fetch live telemetry:', err);
    }
  };

  useEffect(() => {
    fetchLiveTelemetry();
  }, [refreshTrigger]);

  // Calculated virtual ADC value (Simulated 12-bit ADC: dry soil ~3200-4095, saturated ~1200-1600)
  const simulatedRawAdc = Math.round(4095 - (status.moisture / 100) * 2600);

  const handleInject = async () => {
    setIsInjecting(true);
    try {
      await simulateMoisture(sliderVal, 'live_telemetry_injector');
      await fetchLiveTelemetry();
    } finally {
      setIsInjecting(false);
    }
  };

  const isFresh = secondsAgo < 15;
  const isStale = secondsAgo > 60;

  return (
    <div>
      <SimulationBanner />

      {/* Header with Live Status & Polling Stream Controls */}
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
            Live Monitoring
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--ts-text-secondary)', marginTop: 2 }}>
            Real-time telemetry stream from simulated sensor feeds and controller loops.
          </p>
        </div>

        {/* Polling Stream Controller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--ts-surface)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--ts-border)',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--ts-text-secondary)' }}>Polling Rate:</span>
            <select
              value={pollIntervalMs}
              onChange={(e) => setPollIntervalMs(Number(e.target.value))}
              className="form-select"
              style={{ padding: '3px 8px', fontSize: '0.78rem' }}
            >
              <option value={1000}>1 sec (High Speed)</option>
              <option value={3000}>3 sec (Default)</option>
              <option value={5000}>5 sec</option>
              <option value={10000}>10 sec</option>
            </select>
          </div>

          <button
            type="button"
            className={`btn ${pollingActive ? 'btn-secondary' : 'btn-primary'}`}
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
            onClick={() => setPollingActive(!pollingActive)}
          >
            {pollingActive ? (
              <>
                <Pause size={14} /> Pause Stream
              </>
            ) : (
              <>
                <Play size={14} /> Resume Stream
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Status Cards */}
      <section className="stats-grid" aria-label="Live Telemetry Cards">
        <MetricCard
          label="Simulated Moisture"
          value={`${Number(status.moisture || 0).toFixed(1)}%`}
          icon={Gauge}
          accent="forest"
          badge={
            <span
              className={`badge ${
                status.soil_status === 'DRY'
                  ? 'badge-red'
                  : status.soil_status === 'ADEQUATE'
                  ? 'badge-green'
                  : 'badge-amber'
              }`}
            >
              {status.soil_status} Soil
            </span>
          }
          footer={<span>Capacitive Sensor Simulation Model</span>}
        />

        <MetricCard
          label="Simulated 12-Bit ADC"
          value={`${simulatedRawAdc}`}
          icon={Radio}
          accent="forest"
          badge={<span className="badge badge-gray">Virtual ADC Count</span>}
          footer={<span>Simulated MCP3008 conversion output</span>}
        />

        <MetricCard
          label="Telemetry Freshness"
          value={secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}
          icon={Clock}
          accent={isFresh ? 'forest' : isStale ? 'amber' : 'forest'}
          badge={
            isFresh ? (
              <span className="badge badge-green">Fresh Telemetry</span>
            ) : isStale ? (
              <span className="badge badge-amber">Stale Data Warning</span>
            ) : (
              <span className="badge badge-gray">Nominal Cadence</span>
            )
          }
          footer={<span>Source: {status.data_source || 'software_simulator'}</span>}
        />

        <MetricCard
          label="Irrigation State"
          value={status.pump_status || 'OFF'}
          icon={Power}
          accent={status.pump_status === 'ON' ? 'blue' : 'forest'}
          badge={
            status.pump_status === 'ON' ? (
              <span className="badge badge-blue">Virtual Actuator Active</span>
            ) : (
              <span className="badge badge-gray">Virtual Actuator Idle</span>
            )
          }
          footer={<span>Mode: {status.mode}</span>}
        />
      </section>

      {/* Live Stream Telemetry Table */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Activity size={18} color="var(--ts-primary)" /> Live Sensor Telemetry Stream
            </h3>
            <p className="panel-subtitle">Latest chronological telemetry arriving from simulation engine</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-green">
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              Live Ingestion Active
            </span>
            <span className="badge badge-gray">{liveReadings.length} In-Memory</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Seq ID</th>
                <th>Timestamp</th>
                <th>Simulated Sensor Feed</th>
                <th>Soil Moisture</th>
                <th>Condition Status</th>
                <th>Pump Actuation</th>
                <th>Hysteresis Mode</th>
              </tr>
            </thead>
            <tbody>
              {liveReadings.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--ts-text-muted)' }}>
                    #{r.id}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td>
                    <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                      {r.source || 'simulator'}
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
      </section>

      {/* Telemetry Injection Utility */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Sliders size={18} color="var(--ts-primary)" /> Live Telemetry Injection Utility
            </h3>
            <p className="panel-subtitle">Manually transmit a simulated reading to test stream reactivity</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: 200 }}>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderVal}
              onChange={(e) => setSliderVal(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ts-primary)' }}>
              {sliderVal}%
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleInject}
              disabled={isInjecting}
            >
              <Radio size={14} />
              <span>{isInjecting ? 'Transmitting...' : 'Inject Telemetry Packet'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
