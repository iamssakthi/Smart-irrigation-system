import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  RefreshCw,
  Filter,
  Power,
  Sliders,
  Settings,
  Radio,
  Clock,
  Inbox,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import { useSystem } from '../context/SystemContext';
import SimulationBanner from '../components/SimulationBanner';

export default function Events() {
  const { refreshTrigger, notify } = useSystem();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [limit, setLimit] = useState(50);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { limit };
      if (eventTypeFilter !== 'all') params.event_type = eventTypeFilter;
      const res = await api.getEvents(params);
      setEvents(res.events || []);
    } catch (err) {
      notify(`Failed to load event log: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [limit, eventTypeFilter, notify]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshTrigger]);

  const getEventBadge = (type) => {
    if (type.includes('pump_on')) return <span className="badge badge-blue">Pump ON</span>;
    if (type.includes('pump_off')) return <span className="badge badge-green">Pump OFF</span>;
    if (type.includes('manual')) return <span className="badge badge-amber">Manual Command</span>;
    if (type.includes('mode')) return <span className="badge badge-green">Mode Change</span>;
    if (type.includes('threshold')) return <span className="badge badge-amber">Threshold Config</span>;
    if (type.includes('reset')) return <span className="badge badge-red">System Reset</span>;
    return <span className="badge badge-gray">{type}</span>;
  };

  const getEventIcon = (type) => {
    if (type.includes('pump_on')) return <Power size={16} color="var(--ts-info)" />;
    if (type.includes('pump_off')) return <Power size={16} color="var(--ts-secondary)" />;
    if (type.includes('manual')) return <Sliders size={16} color="var(--ts-warning)" />;
    if (type.includes('mode')) return <Sliders size={16} color="var(--ts-primary)" />;
    if (type.includes('threshold')) return <Settings size={16} color="var(--ts-warning)" />;
    return <Activity size={16} color="var(--ts-text-muted)" />;
  };

  // Event counts
  const pumpActivations = events.filter((e) => e.event_type === 'pump_on').length;
  const pumpDeactivations = events.filter((e) => e.event_type === 'pump_off').length;
  const modeChanges = events.filter((e) => e.event_type.includes('mode')).length;

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
            Irrigation Events
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--ts-text-secondary)', marginTop: 2 }}>
            Audit trail of automated controller transitions, manual commands, and system adjustments.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={fetchEvents}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh Events
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card accent-blue">
          <div className="stat-card-top">
            <span className="stat-label">Pump Activations</span>
            <div className="stat-icon"><Power size={18} /></div>
          </div>
          <div className="stat-value">{pumpActivations}</div>
          <div className="stat-footer">Triggered by low soil moisture (&lt; T_dry)</div>
        </div>

        <div className="stat-card accent-forest">
          <div className="stat-card-top">
            <span className="stat-label">Pump Deactivations</span>
            <div className="stat-icon"><CheckCircle2 size={18} /></div>
          </div>
          <div className="stat-value">{pumpDeactivations}</div>
          <div className="stat-footer">Triggered at adequate moisture (&ge; T_wet)</div>
        </div>

        <div className="stat-card accent-amber">
          <div className="stat-card-top">
            <span className="stat-label">Mode Transitions</span>
            <div className="stat-icon"><Sliders size={18} /></div>
          </div>
          <div className="stat-value">{modeChanges}</div>
          <div className="stat-footer">Auto/Manual controller toggles</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Logged Events</span>
            <div className="stat-icon"><Clock size={18} /></div>
          </div>
          <div className="stat-value">{events.length}</div>
          <div className="stat-footer">Stored in SQLite audit log</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="panel" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} color="var(--ts-text-muted)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ts-text-primary)' }}>Filter Type:</span>
            </div>

            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="form-select"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            >
              <option value="all">All Event Types</option>
              <option value="pump_on">Pump Activations (pump_on)</option>
              <option value="pump_off">Pump Deactivations (pump_off)</option>
              <option value="pump_manual">Manual Commands (pump_manual)</option>
              <option value="mode_changed">Mode Changes (mode_changed)</option>
              <option value="threshold_changed">Threshold Updates</option>
              <option value="system_reset">System Resets</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--ts-text-secondary)' }}>Limit:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="form-select"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <CalendarCheck size={18} color="var(--ts-primary)" /> Irrigation Controller Audit Trail
            </h3>
            <p className="panel-subtitle">Discrete state transitions and parameter adjustments</p>
          </div>
          <span className="badge badge-gray">{events.length} Events</span>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox size={24} />
            </div>
            <p className="empty-state-title">No irrigation events found</p>
            <p className="empty-state-desc">
              Events are generated only when controller state genuinely transitions (e.g., pump ON/OFF or threshold edits).
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Description</th>
                  <th>Moisture At Event</th>
                  <th>Operating Mode</th>
                  <th>Event Source</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--ts-text-muted)' }}>
                      #{ev.id}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td>{getEventBadge(ev.event_type)}</td>
                    <td style={{ fontWeight: 500, color: 'var(--ts-text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getEventIcon(ev.event_type)}
                        <span>{ev.description}</span>
                      </div>
                    </td>
                    <td>
                      {ev.moisture_value != null ? (
                        <span style={{ fontWeight: 600 }}>{Number(ev.moisture_value).toFixed(1)}%</span>
                      ) : (
                        <span style={{ color: 'var(--ts-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                        {ev.operating_mode || 'AUTOMATIC'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                        {ev.source || 'system'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
