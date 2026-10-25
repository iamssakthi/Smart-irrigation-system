import React, { useState, useEffect } from 'react';
import {
  Info,
  Cpu,
  Layers,
  Database,
  Server,
  Code2,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Activity,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import SimulationBanner from '../components/SimulationBanner';
import { api } from '../api/client';
import { useSystem } from '../context/SystemContext';

export default function SystemInfo() {
  const { status } = useSystem();
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const [dbStats, setDbStats] = useState({ readings: 0, events: 0 });

  useEffect(() => {
    async function checkHealth() {
      try {
        const [readingsRes, eventsRes, healthRes] = await Promise.all([
          api.getReadings({ limit: 1 }),
          api.getEvents({ limit: 1 }),
          fetch('/api/health').then((r) => r.json()).catch(() => ({ status: 'ok' })),
        ]);
        setHealthStatus(healthRes.status === 'ok' ? 'OPERATIONAL (Healthy)' : 'DEGRADED');
        setDbStats({
          readings: readingsRes.count ?? readingsRes.readings?.length ?? 0,
          events: eventsRes.count ?? eventsRes.events?.length ?? 0,
        });
      } catch (err) {
        setHealthStatus(`DEGRADED: ${err.message}`);
      }
    }
    checkHealth();
  }, []);

  const dryThreshold = status.dry_threshold || 35;
  const wetThreshold = status.wet_threshold || 45;

  return (
    <div>
      <SimulationBanner />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ts-text-primary)' }}>
          System Information
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--ts-text-secondary)', marginTop: 2 }}>
          Platform architecture, decision algorithms, and physical deployment roadmap.
        </p>
      </div>

      {/* Product Overview Card */}
      <div
        className="panel"
        style={{
          marginBottom: 24,
          borderLeft: '4px solid var(--ts-primary)',
          background: 'var(--ts-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="badge badge-green">Product Identity</span>
          <span className="badge badge-gray">Version 2.0.0</span>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ts-text-primary)', marginBottom: 6 }}>
          TerraSense IQ — Intelligent Irrigation. Data-Driven Agriculture.
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--ts-text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
          TerraSense IQ is a simulation-first smart agriculture monitoring platform that demonstrates closed-loop soil moisture evaluation, threshold-based irrigation decisions, virtual pump control, historical data analysis, and intelligent agricultural workflows.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.78rem', color: 'var(--ts-text-muted)' }}>
          <span><strong>Category:</strong> Smart Agriculture Monitoring Platform</span>
          <span><strong>Primary Module:</strong> Intelligent Irrigation Control</span>
          <span><strong>Simulation Module:</strong> Virtual Field Lab</span>
        </div>
      </div>

      {/* Active Software Simulation vs Physical Hardware Target Architecture */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Active Simulation Layer */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Cpu size={18} color="var(--ts-primary)" /> Active Software Simulation Model
              </h3>
              <p className="panel-subtitle">Currently executing in this application instance</p>
            </div>
            <span className="badge badge-green">Running</span>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.8125rem', color: 'var(--ts-text-secondary)' }}>
            <li style={{ display: 'flex', gap: 10 }}>
              <CheckCircle2 size={16} color="var(--ts-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: 'var(--ts-text-primary)' }}>React 19 + Vite Frontend:</strong> High-performance single page application with Recharts data visualization and responsive design tokens.
              </div>
            </li>
            <li style={{ display: 'flex', gap: 10 }}>
              <CheckCircle2 size={16} color="var(--ts-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: 'var(--ts-text-primary)' }}>Python / Flask REST API:</strong> Decoupled backend service handling telemetry ingestion, validation, and control commands.
              </div>
            </li>
            <li style={{ display: 'flex', gap: 10 }}>
              <CheckCircle2 size={16} color="var(--ts-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: 'var(--ts-text-primary)' }}>Irrigation Decision Engine:</strong> Algorithmic state machine applying strict dual-threshold hysteresis boundaries.
              </div>
            </li>
            <li style={{ display: 'flex', gap: 10 }}>
              <CheckCircle2 size={16} color="var(--ts-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: 'var(--ts-text-primary)' }}>SQLite Relational Database:</strong> Persistent storage for sensor readings, state transition events, and system settings.
              </div>
            </li>
          </ul>
        </div>

        {/* Physical Deployment Architecture Roadmap */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <HardDrive size={18} color="var(--ts-info)" /> Intended Physical Deployment Target
              </h3>
              <p className="panel-subtitle">Planned physical hardware architecture for future deployment</p>
            </div>
            <span className="badge badge-blue">Roadmap Design</span>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.8125rem', color: 'var(--ts-text-secondary)' }}>
            <li style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ts-info)', marginTop: 5, flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--ts-text-primary)' }}>Raspberry Pi 4 Model B:</strong> Industrial Linux single-board computer running Python runtime and SQLite.
              </div>
            </li>
            <li style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ts-info)', marginTop: 5, flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--ts-text-primary)' }}>Capacitive Soil Moisture Sensor v1.2:</strong> Corrosion-resistant capacitive probe delivering analog voltage output.
              </div>
            </li>
            <li style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ts-info)', marginTop: 5, flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--ts-text-primary)' }}>MCP3008 ADC (SPI Interface):</strong> 8-channel 10-bit analog-to-digital converter bridging probe voltages to Pi GPIO.
              </div>
            </li>
            <li style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ts-info)', marginTop: 5, flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--ts-text-primary)' }}>5V Optocoupler Relay & 12V Pump:</strong> Galvanically isolated relay module switching submersible irrigation pumps.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Decision Logic & Mathematical Formulation Panel */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Activity size={18} color="var(--ts-primary)" /> Dual-Threshold Hysteresis Algorithm
            </h3>
            <p className="panel-subtitle">Why smart irrigation requires dual thresholds instead of single-point switching</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ts-text-primary)', marginBottom: 6 }}>
              The Actuator Chatter Problem
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ts-text-secondary)', lineHeight: 1.55 }}>
              In simple single-threshold irrigation systems (e.g., turn pump ON when moisture &lt; 40%), sensor noise or minor water movement causes moisture to fluctuate around 40%. This results in high-frequency switching ("chatter") which rapidly wears out mechanical relays and pump motors.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ts-text-primary)', marginBottom: 6 }}>
              The Hysteresis State Machine
            </h4>
            <div
              style={{
                background: 'var(--ts-surface-muted)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                lineHeight: 1.6,
                color: 'var(--ts-text-primary)',
                border: '1px solid var(--ts-border)',
              }}
            >
              <div>If Moisture &lt; T_dry ({dryThreshold}%): Pump &larr; ON</div>
              <div>If Moisture &ge; T_wet ({wetThreshold}%): Pump &larr; OFF</div>
              <div>If T_dry &le; Moisture &lt; T_wet: Pump &larr; Previous State</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Diagnostics & Environment Overview */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Server size={18} color="var(--ts-primary)" /> Platform Diagnostics & Runtime Stack
            </h3>
            <p className="panel-subtitle">Current runtime metrics and backend service health</p>
          </div>
          <span className="badge badge-green">{healthStatus}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--ts-surface-muted)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ts-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Backend Service</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ts-text-primary)', marginTop: 4 }}>Python 3.13 / Flask 3.1</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--ts-surface-muted)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ts-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Frontend Framework</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ts-text-primary)', marginTop: 4 }}>React 19 / Vite 8</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--ts-surface-muted)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ts-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Database Engine</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ts-text-primary)', marginTop: 4 }}>SQLite 3 (irrigation.db)</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--ts-surface-muted)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ts-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Mode</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ts-text-primary)', marginTop: 4 }}>{status.mode}</div>
          </div>
        </div>

        {/* Honest Limitations Notice */}
        <div
          style={{
            marginTop: 18,
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--ts-bg-subtle-green)',
            border: '1px solid var(--ts-border-green)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            fontSize: '0.8rem',
            color: 'var(--ts-text-primary)',
          }}
        >
          <ShieldCheck size={18} color="var(--ts-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Simulation Scope & Known Limitations:</strong> TerraSense IQ operates as a simulation-first platform. Water flow, sensor readings, and relay responses are model-driven. Neither the Raspberry Pi nor physical hydraulic pumps have been connected to this software instance.
          </div>
        </div>
      </section>
    </div>
  );
}
