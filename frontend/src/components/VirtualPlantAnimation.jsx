import React from 'react';
import { Droplets, Power } from 'lucide-react';

export default function VirtualPlantAnimation({
  pumpStatus = 'OFF',
  moisture = 50,
  isPaused = false,
  mode = 'AUTOMATIC',
}) {
  const isPumpOn = pumpStatus === 'ON';

  // Plant visual state based on simulated moisture
  const isDry = moisture < 35;
  const isOptimal = moisture >= 35 && moisture <= 70;
  const isSaturated = moisture > 70;

  // Leaf and soil tones corresponding to agricultural moisture status
  const leafColor = isDry ? '#B7791F' : isOptimal ? '#2E8B62' : '#176B4D';
  const soilFill = isDry ? '#A3704C' : isOptimal ? '#654321' : '#4A3018';

  return (
    <div
      style={{
        background: 'var(--ts-surface)',
        border: '1px solid var(--ts-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Simulation status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: 16,
        }}
      >
        <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
          Simulated Digital Twin
        </span>

        {isPaused ? (
          <span className="badge badge-amber">Simulation Paused</span>
        ) : isPumpOn ? (
          <span className="badge badge-blue">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--ts-info)',
                display: 'inline-block',
                marginRight: 4,
              }}
            />
            Irrigation Active (Simulated Flow)
          </span>
        ) : (
          <span className="badge badge-gray">Irrigation Standby (Pump OFF)</span>
        )}
      </div>

      {/* SVG Canvas for Reservoir, Pump, Pipe, Plant & Soil */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, height: 230 }}>
        <svg
          viewBox="0 0 380 230"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          role="img"
          aria-label="Simulated plant and drip irrigation visualization"
        >
          <defs>
            {/* Water pipe gradient */}
            <linearGradient id="pipeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#718096" />
              <stop offset="50%" stopColor="#A0AEC0" />
              <stop offset="100%" stopColor="#718096" />
            </linearGradient>

            {/* Pump unit gradient */}
            <linearGradient id="pumpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPumpOn ? '#2878C7' : '#718096'} />
              <stop offset="100%" stopColor={isPumpOn ? '#1A4F82' : '#4A5568'} />
            </linearGradient>

            {/* Soil gradient */}
            <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={soilFill} />
              <stop offset="100%" stopColor="#2D1C0F" />
            </linearGradient>
          </defs>

          {/* Water Reservoir / Source Tank on left */}
          <rect x="15" y="45" width="45" height="75" rx="6" fill="#EDF2F7" stroke="#CBD5E0" strokeWidth="1.5" />
          <rect x="18" y="62" width="39" height="55" rx="3" fill="#2878C7" opacity="0.4" />
          <text x="37" y="38" fill="var(--ts-text-muted)" fontSize="9" fontWeight="700" textAnchor="middle" letterSpacing="0.05em">
            TANK
          </text>

          {/* Water Pump Unit */}
          <rect
            x="76"
            y="68"
            width="34"
            height="34"
            rx="6"
            fill="url(#pumpGrad)"
            stroke={isPumpOn ? '#2878C7' : '#A0AEC0'}
            strokeWidth="2"
          />
          {/* Pump blades / spinner */}
          <g transform="translate(93, 85)">
            <circle cx="0" cy="0" r="8" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
            <path
              d="M0 -6 L0 6 M-6 0 L6 0"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                transformOrigin: 'center',
                animation: isPumpOn && !isPaused ? 'spin 1.2s linear infinite' : 'none',
              }}
            />
          </g>
          <text x="93" y="116" fill={isPumpOn ? '#2878C7' : 'var(--ts-text-muted)'} fontSize="9" fontWeight="700" textAnchor="middle">
            PUMP {isPumpOn ? 'ON' : 'OFF'}
          </text>

          {/* Pipe Connecting Tank to Pump */}
          <path d="M60 85 L76 85" stroke="url(#pipeGrad)" strokeWidth="6" strokeLinecap="round" />

          {/* Main Irrigation Drip Pipe going to Plant root zone */}
          <path
            d="M110 85 L280 85 L280 125"
            fill="none"
            stroke="url(#pipeGrad)"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Animated Water Flow in Pipe when Pump is ON */}
          {isPumpOn && (
            <path
              d="M60 85 L280 85 L280 125"
              fill="none"
              stroke="#2878C7"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              style={{
                animation: isPaused ? 'none' : 'dashFlow 0.8s linear infinite',
              }}
            />
          )}

          {/* Drip Emitter Nozzle */}
          <circle cx="280" cy="127" r="4.5" fill="#4A5568" />

          {/* Animated Water Droplets falling into soil */}
          {isPumpOn && !isPaused && (
            <g>
              <circle cx="280" cy="136" r="2.5" fill="#2878C7">
                <animate attributeName="cy" values="134;152;134" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1s" repeatCount="indefinite" />
              </circle>
              <circle cx="280" cy="144" r="2" fill="#2878C7">
                <animate attributeName="cy" values="140;156;140" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Soil Layer Profile */}
          <rect x="180" y="150" width="180" height="70" rx="8" fill="url(#soilGrad)" />
          {/* Soil moisture level line */}
          <line x1="180" y1="150" x2="360" y2="150" stroke="#78350F" strokeWidth="2" opacity="0.6" />

          {/* Root Structure in Soil */}
          <path
            d="M260 150 Q255 170 250 185 M260 155 Q268 175 272 195 M260 160 Q260 180 260 205 M260 165 Q245 178 240 190 M260 170 Q275 185 285 200"
            fill="none"
            stroke="#D69E2E"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Plant Stem */}
          <path
            d="M260 150 Q260 110 258 75"
            fill="none"
            stroke={leafColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Plant Leaves */}
          {/* Left leaf */}
          <path
            d="M259 115 C230 110 220 90 235 80 C250 90 255 105 259 115 Z"
            fill={leafColor}
            stroke="#176B4D"
            strokeWidth="1"
          />
          {/* Right leaf */}
          <path
            d="M258 95 C285 90 295 70 280 60 C265 70 260 85 258 95 Z"
            fill={leafColor}
            stroke="#176B4D"
            strokeWidth="1"
          />
          {/* Top leaf */}
          <path
            d="M258 75 C250 45 266 45 258 75 Z"
            fill={leafColor}
            stroke="#176B4D"
            strokeWidth="1"
          />

          {/* Plant Condition Tag */}
          <text x="260" y="32" fill="var(--ts-text-primary)" fontSize="10" fontWeight="600" textAnchor="middle">
            {isDry ? 'Dry Soil (Stress)' : isOptimal ? 'Optimal Moisture' : 'Saturated Soil'}
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--ts-border-subtle)', fontSize: '0.78rem', color: 'var(--ts-text-muted)' }}>
        <span>Simulated Moisture: <strong>{Number(moisture).toFixed(1)}%</strong></span>
        <span>Hysteresis Mode: <strong>{mode}</strong></span>
      </div>
    </div>
  );
}
