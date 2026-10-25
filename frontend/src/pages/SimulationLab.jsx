import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sliders,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import SimulationBanner from '../components/SimulationBanner';
import VirtualPlantAnimation from '../components/VirtualPlantAnimation';

export default function SimulationLab() {
  const { status, simulateMoisture, notify } = useSystem();

  const [sliderMoisture, setSliderMoisture] = useState(Math.round(status.moisture || 50));
  const [numericMoisture, setNumericMoisture] = useState(Math.round(status.moisture || 50));
  const [isAutoSimActive, setIsAutoSimActive] = useState(false);
  const [isSimPaused, setIsSimPaused] = useState(false);
  const [activePipelineStage, setActivePipelineStage] = useState(null);
  const [simLog, setSimLog] = useState([
    {
      id: 1,
      time: new Date().toLocaleTimeString(),
      stage: 'Engine Initialized',
      message: 'Virtual Field Lab online with dual-threshold hysteresis controller.',
    },
  ]);
  const [lastProcessedTime, setLastProcessedTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const val = Math.round(status.moisture || 50);
    setSliderMoisture(val);
    setNumericMoisture(val);
  }, [status.moisture]);

  const addSimLog = (stage, message) => {
    setSimLog((prev) => [
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        stage,
        message,
      },
      ...prev.slice(0, 14),
    ]);
  };

  const triggerPipelineAnimation = async () => {
    const stages = [1, 2, 3, 4, 5, 6, 7];
    for (const stage of stages) {
      setActivePipelineStage(stage);
      await new Promise((r) => setTimeout(r, 70));
    }
    setTimeout(() => setActivePipelineStage(null), 250);
  };

  const handleSimulateValue = async (val, source = 'virtual_field_lab') => {
    const clamped = Math.max(0, Math.min(100, Number(val)));
    setSliderMoisture(clamped);
    setNumericMoisture(clamped);
    await triggerPipelineAnimation();
    try {
      const res = await simulateMoisture(clamped, source);
      setLastProcessedTime(new Date().toLocaleTimeString());
      addSimLog(
        'Reading Processed',
        `Injected ${clamped}% moisture. Pump state: ${res?.status?.pump_status || status.pump_status} (Mode: ${status.mode})`
      );
    } catch (err) {
      addSimLog('Simulation Error', err.message);
    }
  };

  // Automated Drying & Irrigation Simulation Cycle
  useEffect(() => {
    if (!isAutoSimActive || isSimPaused) return;

    const interval = setInterval(() => {
      setSliderMoisture((curr) => {
        let next;
        if (status.pump_status === 'ON') {
          // If pump is active, soil moisture rises (+4%)
          next = Math.min(100, curr + 4);
        } else {
          // If pump is inactive, soil dries out (-3%) due to natural evaporation
          next = Math.max(5, curr - 3);
        }
        handleSimulateValue(next, 'auto_field_cycle');
        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isAutoSimActive, isSimPaused, status.pump_status]);

  const handleStep = (delta) => {
    const next = Math.max(0, Math.min(100, sliderMoisture + delta));
    handleSimulateValue(next, 'manual_step');
  };

  const handleResetSim = async () => {
    setIsAutoSimActive(false);
    setIsSimPaused(false);
    setSliderMoisture(50);
    setNumericMoisture(50);
    await handleSimulateValue(50, 'simulation_reset');
    notify('Simulation reset to 50% baseline.', 'info');
  };

  const dryThreshold = status.dry_threshold || 35;
  const wetThreshold = status.wet_threshold || 45;

  // Dynamic decision explanation based strictly on actual state
  const getDecisionExplanation = () => {
    if (status.mode === 'MANUAL') {
      return `System is running in MANUAL mode. Automatic hysteresis decision logic is bypassed. The virtual pump is currently ${status.pump_status} by operator command.`;
    }
    if (sliderMoisture < dryThreshold) {
      return `Moisture is below the dry threshold (${sliderMoisture}% < ${dryThreshold}%). Automatic irrigation has been activated. Virtual pump is ON to replenish moisture.`;
    }
    if (sliderMoisture >= wetThreshold) {
      return `Moisture has reached the adequate threshold (${sliderMoisture}% ≥ ${wetThreshold}%). Automatic irrigation has been deactivated. Virtual pump is OFF to prevent over-watering.`;
    }
    return `Moisture is between the configured thresholds (${dryThreshold}% - ${wetThreshold}%). The previous pump state (${status.pump_status}) is retained by the hysteresis deadband.`;
  };

  // Pipeline architecture definitions
  const pipelineStages = [
    {
      id: 1,
      title: 'Virtual Soil Input',
      sub: 'User parameter',
      val: `${sliderMoisture}%`,
      badge: 'Input Layer',
    },
    {
      id: 2,
      title: 'Sensor Simulation',
      sub: 'ADC conversion',
      val: `${Math.round(4095 - (sliderMoisture / 100) * 2600)} ADC`,
      badge: 'Sensor Model',
    },
    {
      id: 3,
      title: 'ESP32 Logic Model',
      sub: 'JSON validation',
      val: 'Valid telemetry',
      badge: 'Firmware Model',
    },
    {
      id: 4,
      title: 'Moisture Interpretation',
      sub: 'Condition logic',
      val: sliderMoisture < dryThreshold ? 'DRY' : sliderMoisture >= wetThreshold ? 'ADEQUATE' : 'TRANSITION',
      badge: 'Analytical',
    },
    {
      id: 5,
      title: 'Irrigation Decision Engine',
      sub: 'Dual-threshold logic',
      val: `T_dry=${dryThreshold}%, T_wet=${wetThreshold}%`,
      badge: 'Hysteresis Engine',
    },
    {
      id: 6,
      title: 'Virtual Pump State',
      sub: 'Relay command',
      val: `Pump ${status.pump_status}`,
      badge: 'Actuator Model',
    },
    {
      id: 7,
      title: 'Dashboard & History',
      sub: 'SQLite persistence',
      val: 'Saved to DB',
      badge: 'Analytics Layer',
    },
  ];

  return (
    <div>
      <SimulationBanner />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ts-text-primary)' }}>
          Virtual Field Lab
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--ts-text-secondary)', marginTop: 2 }}>
          Explore soil moisture conditions and observe how the irrigation controller responds.
        </p>
      </div>

      {/* A. VISUAL SYSTEM ARCHITECTURE PIPELINE */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Layers size={18} color="var(--ts-primary)" /> Simulation Processing Pipeline
            </h3>
            <p className="panel-subtitle">
              End-to-end dataflow from simulated soil input through firmware logic to virtual actuator states
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-green">Pure Software Simulation</span>
            <span className="badge badge-gray">No Physical Hardware</span>
          </div>
        </div>

        {/* Pipeline Stage Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: 10,
            position: 'relative',
          }}
        >
          {pipelineStages.map((stage, idx) => {
            const isActive = activePipelineStage === stage.id;
            return (
              <div
                key={stage.id}
                style={{
                  background: isActive ? 'var(--ts-bg-subtle-green)' : 'var(--ts-surface-muted)',
                  border: `1px solid ${isActive ? 'var(--ts-primary)' : 'var(--ts-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 110,
                  transition: 'all 200ms ease',
                  transform: isActive ? 'scale(1.03)' : 'none',
                  boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ts-text-muted)' }}>
                      0{stage.id}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--ts-surface)',
                        color: 'var(--ts-text-secondary)',
                      }}
                    >
                      {stage.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ts-text-primary)', lineHeight: 1.25 }}>
                    {stage.title}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--ts-text-muted)', marginTop: 2 }}>
                    {stage.sub}
                  </div>
                </div>

                <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--ts-border-subtle)' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isActive ? 'var(--ts-primary)' : 'var(--ts-text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {stage.val}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architectural Clarity Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--ts-border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--ts-text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span><strong>Model Types:</strong></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ts-primary)' }} />
              Active Software Simulation
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ts-info)' }} />
              Wokwi ESP32 Prototype (Optional Telemetry API)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ts-text-muted)' }} />
              Physical Hardware (Future Roadmap)
            </span>
          </div>
          <span>Last Cycle: {lastProcessedTime}</span>
        </div>
      </section>

      {/* Main Workspace Split: Controls + Plant Visualization */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* B & E: INTERACTIVE CONTROLS & SCENARIO PRESETS */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Sliders size={18} color="var(--ts-primary)" /> Interactive Moisture Controls
              </h3>
              <p className="panel-subtitle">Inject arbitrary soil moisture or select demonstration scenarios</p>
            </div>
            <span className="badge badge-green">{sliderMoisture}% Active</span>
          </div>

          {/* Slider & Numeric Input */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ts-text-primary)' }}>
                Target Soil Moisture (%):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={numericMoisture}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setNumericMoisture(v);
                    setSliderMoisture(v);
                  }}
                  className="form-input"
                  style={{ width: 75, textAlign: 'right', fontWeight: 700 }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={() => handleSimulateValue(numericMoisture, 'manual_numeric_input')}
                >
                  Apply
                </button>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderMoisture}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSliderMoisture(v);
                setNumericMoisture(v);
              }}
              onMouseUp={() => handleSimulateValue(sliderMoisture, 'manual_slider')}
              onTouchEnd={() => handleSimulateValue(sliderMoisture, 'manual_slider')}
              className="range-slider"
            />
          </div>

          {/* Quick Demonstration Scenario Presets */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ts-text-secondary)', display: 'block', marginBottom: 8 }}>
              Quick Scenario Presets:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', fontSize: '0.78rem', padding: '8px 12px' }}
                onClick={() => handleSimulateValue(22, 'preset_dry')}
              >
                <span>Dry Soil</span>
                <span className="badge badge-red">22%</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', fontSize: '0.78rem', padding: '8px 12px' }}
                onClick={() => handleSimulateValue(40, 'preset_transition')}
              >
                <span>Transition Range</span>
                <span className="badge badge-amber">40%</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', fontSize: '0.78rem', padding: '8px 12px' }}
                onClick={() => handleSimulateValue(55, 'preset_adequate')}
              >
                <span>Adequate Moisture</span>
                <span className="badge badge-green">55%</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', fontSize: '0.78rem', padding: '8px 12px' }}
                onClick={() => handleSimulateValue(80, 'preset_very_wet')}
              >
                <span>Very Wet Soil</span>
                <span className="badge badge-blue">80%</span>
              </button>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--ts-text-muted)', marginTop: 6 }}>
              Demonstration scenarios evaluate the shared controller and persist to SQLite.
            </p>
          </div>

          {/* E. SIMULATION CONTROLS */}
          <div style={{ paddingTop: 14, borderTop: '1px solid var(--ts-border-subtle)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ts-text-secondary)', display: 'block', marginBottom: 8 }}>
              Simulation Engine Controls:
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${isAutoSimActive ? 'btn-secondary' : 'btn-primary'}`}
                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                onClick={() => {
                  setIsAutoSimActive(!isAutoSimActive);
                  setIsSimPaused(false);
                }}
              >
                {isAutoSimActive ? <Pause size={14} /> : <Play size={14} />}
                <span>{isAutoSimActive ? 'Stop Auto Cycle' : 'Start Auto Cycle'}</span>
              </button>

              {isAutoSimActive && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                  onClick={() => setIsSimPaused(!isSimPaused)}
                >
                  {isSimPaused ? <Play size={14} /> : <Pause size={14} />}
                  <span>{isSimPaused ? 'Resume' : 'Pause'}</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                onClick={() => handleStep(5)}
                title="Increase moisture by 5%"
              >
                <StepForward size={14} /> +5%
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                onClick={() => handleStep(-5)}
                title="Decrease moisture by 5%"
              >
                -5%
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                onClick={handleResetSim}
                title="Reset to 50% baseline"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* D. PLANT AND IRRIGATION VISUALIZATION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <VirtualPlantAnimation
            pumpStatus={status.pump_status}
            moisture={sliderMoisture}
            isPaused={isSimPaused}
            mode={status.mode}
          />

          {/* C. DYNAMIC DECISION EXPLANATION */}
          <div
            style={{
              background: 'var(--ts-surface)',
              border: '1px solid var(--ts-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <CheckCircle2 size={16} color="var(--ts-primary)" />
              <strong style={{ fontSize: '0.875rem', color: 'var(--ts-text-primary)' }}>
                Dynamic Controller Explanation
              </strong>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--ts-text-secondary)', lineHeight: 1.55 }}>
              {getDecisionExplanation()}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Simulation Event Stream */}
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <Clock size={18} color="var(--ts-primary)" /> Simulation Activity Stream
          </h3>
          <span className="badge badge-gray">{simLog.length} Entries</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {simLog.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--ts-surface-muted)',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                  {log.stage}
                </span>
                <span style={{ color: 'var(--ts-text-primary)', fontWeight: 500 }}>
                  {log.message}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--ts-text-muted)', whiteSpace: 'nowrap' }}>
                {log.time}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
