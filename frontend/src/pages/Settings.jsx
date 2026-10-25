import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  Moon,
  Sun,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import SimulationBanner from '../components/SimulationBanner';

export default function Settings() {
  const { status, updateThresholds, switchMode, notify, pollIntervalMs, setPollIntervalMs } = useSystem();

  const [dryVal, setDryVal] = useState(status.dry_threshold || 35);
  const [wetVal, setWetVal] = useState(status.wet_threshold || 45);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setDryVal(status.dry_threshold || 35);
    setWetVal(status.wet_threshold || 45);
  }, [status.dry_threshold, status.wet_threshold]);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setIsDarkMode(isDark);
  }, []);

  const handleToggleTheme = (enableDark) => {
    setIsDarkMode(enableDark);
    if (enableDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // Validate thresholds
  useEffect(() => {
    if (Number(dryVal) >= Number(wetVal)) {
      setValidationError('Adequate moisture threshold must be strictly greater than the dry threshold to create a functional hysteresis deadband.');
    } else if (Number(dryVal) < 0 || Number(wetVal) > 100) {
      setValidationError('Threshold values must be between 0% and 100%.');
    } else {
      setValidationError('');
    }
  }, [dryVal, wetVal]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (validationError) return;

    setIsSaving(true);
    try {
      await updateThresholds(Number(dryVal), Number(wetVal));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setDryVal(35.0);
    setWetVal(45.0);
  };

  return (
    <div>
      <SimulationBanner />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ts-text-primary)' }}>
          Configuration
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--ts-text-secondary)', marginTop: 2 }}>
          Tune dual-threshold hysteresis parameters, operating modes, and interface preferences.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Threshold Configuration Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Sliders size={18} color="var(--ts-primary)" /> Hysteresis Thresholds
              </h3>
              <p className="panel-subtitle">Define automatic irrigation activation and deactivation moisture levels</p>
            </div>
            <span className="badge badge-green">Hysteresis Model</span>
          </div>

          <form onSubmit={handleSave}>
            {/* Dry Threshold Input */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ts-error)' }}>
                  Dry Soil Trigger Threshold (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="0.5"
                  value={dryVal}
                  onChange={(e) => setDryVal(Number(e.target.value))}
                  className="form-input"
                  style={{ width: 80, textAlign: 'right', fontWeight: 700 }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="0.5"
                value={dryVal}
                onChange={(e) => setDryVal(Number(e.target.value))}
                className="range-slider"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--ts-text-muted)', marginTop: 5 }}>
                When moisture drops below this value in Auto mode, the pump turns ON.
              </p>
            </div>

            {/* Wet / Adequate Threshold Input */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ts-primary)' }}>
                  Adequate Moisture Target Threshold (%):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.5"
                  value={wetVal}
                  onChange={(e) => setWetVal(Number(e.target.value))}
                  className="form-input"
                  style={{ width: 80, textAlign: 'right', fontWeight: 700 }}
                />
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="0.5"
                value={wetVal}
                onChange={(e) => setWetVal(Number(e.target.value))}
                className="range-slider"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--ts-text-muted)', marginTop: 5 }}>
                When moisture reaches this level, the pump turns OFF to prevent saturation.
              </p>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'var(--ts-error-bg)',
                  border: '1px solid var(--ts-error-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--ts-error)',
                  fontSize: '0.8125rem',
                  marginBottom: 20,
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Visual Deadband Diagram */}
            <div
              style={{
                background: 'var(--ts-surface-muted)',
                border: '1px solid var(--ts-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ts-text-secondary)', marginBottom: 8 }}>
                Visual Moisture Zones:
              </div>
              <div style={{ display: 'flex', height: 26, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--ts-border)' }}>
                <div
                  style={{
                    width: `${dryVal}%`,
                    background: 'var(--ts-error-bg)',
                    color: 'var(--ts-error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                  title="Dry zone (Pump triggers ON)"
                >
                  Dry &lt;{dryVal}%
                </div>
                <div
                  style={{
                    width: `${Math.max(0, wetVal - dryVal)}%`,
                    background: 'var(--ts-warning-bg)',
                    color: 'var(--ts-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                  title="Transition deadband (Pump maintains previous state)"
                >
                  Deadband ({dryVal}-{wetVal}%)
                </div>
                <div
                  style={{
                    width: `${Math.max(0, 100 - wetVal)}%`,
                    background: 'var(--ts-bg-subtle-green)',
                    color: 'var(--ts-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                  title="Adequate zone (Pump triggers OFF)"
                >
                  Adequate &ge;{wetVal}%
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetDefaults}
                disabled={isSaving}
              >
                <RotateCcw size={14} /> Reset Defaults (35 / 45)
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving || Boolean(validationError)}
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Operating Mode & Platform Preferences Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Controller Operating Mode Card */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  <SlidersHorizontal size={18} color="var(--ts-primary)" /> Controller Operating Mode
                </h3>
                <p className="panel-subtitle">Toggle between automatic threshold evaluation and operator override</p>
              </div>
              <span className={`badge ${status.mode === 'MANUAL' ? 'badge-amber' : 'badge-green'}`}>
                {status.mode}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button
                type="button"
                className={`btn ${status.mode === 'AUTOMATIC' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '10px 14px' }}
                onClick={() => switchMode('AUTOMATIC')}
              >
                Automatic (Closed-Loop)
              </button>
              <button
                type="button"
                className={`btn ${status.mode === 'MANUAL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '10px 14px' }}
                onClick={() => switchMode('MANUAL')}
              >
                Manual (Operator Override)
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--ts-text-secondary)', lineHeight: 1.5 }}>
              In <strong>AUTOMATIC</strong> mode, the controller continuously evaluates soil moisture against the dual-threshold hysteresis boundaries. In <strong>MANUAL</strong> mode, threshold rules are suspended and actuator state is controlled via operator commands.
            </p>
          </div>

          {/* Simulation & Interface Preferences Card */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  <SettingsIcon size={18} color="var(--ts-primary)" /> Interface & Cadence Preferences
                </h3>
                <p className="panel-subtitle">Configure telemetry polling intervals and visual theme</p>
              </div>
            </div>

            {/* Polling Interval Setting */}
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ts-text-primary)' }}>
                  Telemetry Polling Rate:
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ts-text-muted)' }}>
                  Interval for querying backend controller status
                </div>
              </div>
              <select
                value={pollIntervalMs}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPollIntervalMs(val);
                  notify(`Polling interval updated to ${val / 1000} seconds.`, 'info');
                }}
                className="form-select"
                style={{ width: 140 }}
              >
                <option value={1000}>1 second</option>
                <option value={3000}>3 seconds</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
              </select>
            </div>

            {/* Visual Appearance Preference */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--ts-border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ts-text-primary)' }}>
                  Theme Appearance:
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ts-text-muted)' }}>
                  Choose refined light theme or industrial dark mode
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className={`btn ${!isDarkMode ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={() => handleToggleTheme(false)}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  type="button"
                  className={`btn ${isDarkMode ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={() => handleToggleTheme(true)}
                >
                  <Moon size={14} /> Dark
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
