/**
 * dashboard.js — Overview page controller.
 * Depends on: shared.js (fetchJson), Chart.js (chart.umd.min.js)
 */

// ─── State ────────────────────────────────────────────────────────────────────
let overviewChart = null;
let simulateDebounceId = null;
let currentDryThreshold = 35;   // updated from every /api/status response
let currentWetThreshold = 45;
let pollingInterval = null;

// ─── Feedback ─────────────────────────────────────────────────────────────────
function setFeedback(message, isError = false) {
    const el = document.getElementById('action-feedback');
    if (!el) return;
    el.textContent = message;
    el.className = 'feedback' + (isError ? ' feedback-error' : '');
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function renderStatus(status) {
    const moistureValue = Number(status.moisture ?? 0).toFixed(1);
    const condition     = status.soil_status  || 'UNKNOWN';
    const pump          = status.pump_status  || 'OFF';
    const mode          = status.mode         || 'AUTOMATIC';

    // Live threshold values — kept in module scope for chart rendering
    currentDryThreshold = Number(status.dry_threshold ?? 35);
    currentWetThreshold = Number(status.wet_threshold ?? 45);

    setText('current-moisture',  `${moistureValue}%`);
    setText('soil-status',       condition);
    setText('pump-status',       pump);
    setText('mode-status',       `Mode: ${mode}`);
    setText('soil-condition',    condition);
    setText('connection-status', status.connection_status || 'SIMULATED');
    setText('operating-mode',    mode);
    setText('dry-threshold',     `${currentDryThreshold.toFixed(0)}%`);
    setText('wet-threshold',     `${currentWetThreshold.toFixed(0)}%`);
    setText('source-label',      status.source      || 'simulated');
    setText('data-source',       status.data_source || 'simulated');
    setText('last-updated',      new Date(status.last_updated || Date.now()).toLocaleString());

    // Visual indicator on pump card
    const pumpCard = document.getElementById('pump-status')?.closest('.status-card');
    if (pumpCard) {
        pumpCard.classList.toggle('pump-active', pump === 'ON');
        pumpCard.classList.toggle('pump-inactive', pump === 'OFF');
    }

    // Sync slider to last known moisture without firing simulate
    const slider = document.getElementById('moisture-slider');
    if (slider && !slider.matches(':active')) {
        slider.value = String(Math.round(Number(status.moisture || 0)));
        setText('slider-value', `${Math.round(Number(status.moisture || 0))}%`);
    }

    syncModeControls(mode);
}

/** Null-safe element text setter. */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function syncModeControls(mode) {
    const isManual = mode === 'MANUAL';
    toggleClass('auto-mode-btn',   'mode-button-active', !isManual);
    toggleClass('manual-mode-btn', 'mode-button-active',  isManual);
    setDisabled('pump-on-btn',  !isManual);
    setDisabled('pump-off-btn', !isManual);
}

function toggleClass(id, cls, condition) {
    document.getElementById(id)?.classList.toggle(cls, condition);
}

function setDisabled(id, disabled) {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
}

// ─── Chart ────────────────────────────────────────────────────────────────────
function renderOverviewChart(readings) {
    const chartCanvas = document.getElementById('overview-chart');
    const emptyState  = document.getElementById('overview-chart-empty');
    if (!chartCanvas) return;

    if (!readings || readings.length === 0) {
        if (overviewChart) { overviewChart.destroy(); overviewChart = null; }
        emptyState?.classList.remove('hidden');
        chartCanvas.classList.add('hidden');
        return;
    }

    emptyState?.classList.add('hidden');
    chartCanvas.classList.remove('hidden');

    const series    = readings.slice(0, 30).slice().reverse();
    const labels    = series.map(r => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const moisture  = series.map(r => Number(r.soil_moisture));
    const pumpState = series.map(r => r.pump_status === 'ON' ? 1 : 0);

    // Use live thresholds (updated by renderStatus) — not hardcoded 35/45
    const dry = new Array(series.length).fill(currentDryThreshold);
    const wet = new Array(series.length).fill(currentWetThreshold);

    if (overviewChart) {
        // Update in place to avoid flicker on every 4s poll
        overviewChart.data.labels                   = labels;
        overviewChart.data.datasets[0].data         = moisture;
        overviewChart.data.datasets[1].data         = pumpState;
        overviewChart.data.datasets[2].data         = dry;
        overviewChart.data.datasets[3].data         = wet;
        overviewChart.update('none');   // 'none' = no animation on refresh
        return;
    }

    overviewChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Moisture (%)',
                    data: moisture,
                    borderColor: '#2d7a4a',
                    backgroundColor: 'rgba(45, 122, 74, 0.14)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    yAxisID: 'y',
                },
                {
                    label: 'Pump (ON=1)',
                    data: pumpState,
                    borderColor: '#2d7ae6',
                    backgroundColor: 'rgba(45, 122, 230, 0.08)',
                    fill: true,
                    tension: 0,
                    pointRadius: 0,
                    borderWidth: 2,
                    stepped: true,
                    yAxisID: 'yPump',
                },
                {
                    label: `Dry threshold (${currentDryThreshold}%)`,
                    data: dry,
                    borderColor: '#d9534f',
                    borderDash: [6, 6],
                    pointRadius: 0,
                    borderWidth: 1.5,
                    yAxisID: 'y',
                },
                {
                    label: `Wet threshold (${currentWetThreshold}%)`,
                    data: wet,
                    borderColor: '#eebf41',
                    borderDash: [6, 6],
                    pointRadius: 0,
                    borderWidth: 1.5,
                    yAxisID: 'y',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    min: 0, max: 100,
                    title: { display: true, text: 'Moisture (%)' },
                    position: 'left',
                },
                yPump: {
                    min: 0, max: 1.5,
                    display: false,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                },
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            if (ctx.datasetIndex === 1) return ` Pump: ${ctx.parsed.y === 1 ? 'ON' : 'OFF'}`;
                            return ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}`;
                        },
                    },
                },
            },
        },
    });
}

// ─── Recent readings table ─────────────────────────────────────────────────────
function renderReadings(readings) {
    const body = document.getElementById('recent-readings-body');
    if (!body) return;
    if (!readings || readings.length === 0) {
        body.innerHTML = '<tr><td colspan="3" style="color:var(--muted);text-align:center">No readings yet.</td></tr>';
        return;
    }
    body.innerHTML = readings.slice(0, 8).map(r => `
        <tr>
            <td>${new Date(r.timestamp).toLocaleTimeString()}</td>
            <td>${Number(r.soil_moisture).toFixed(1)}%</td>
            <td><span class="state-badge state-${(r.soil_status || '').toLowerCase()}">${r.soil_status}</span></td>
        </tr>
    `).join('');
}

// ─── Events list ──────────────────────────────────────────────────────────────
function renderEvents(events) {
    const list  = document.getElementById('event-list');
    const table = document.getElementById('event-table-body');
    if (!list && !table) return;

    const eventIcon = type => {
        if (type === 'pump_on')  return '🟢';
        if (type === 'pump_off') return '🔴';
        if (type.includes('manual')) return '✋';
        if (type.includes('mode'))  return '🔄';
        if (type.includes('threshold')) return '⚙️';
        return '📋';
    };

    if (list) {
        list.innerHTML = (events || []).slice(0, 6).map(e => `
            <li>
                <strong>${eventIcon(e.event_type)} ${e.event_type}</strong>
                <br><span style="font-size:0.85em;color:var(--muted)">${e.description}</span>
                <br><small>${new Date(e.timestamp).toLocaleTimeString()}</small>
            </li>
        `).join('') || '<li style="color:var(--muted)">No events yet.</li>';
    }

    if (table) {
        table.innerHTML = (events || []).map(e => `
            <tr>
                <td>${new Date(e.timestamp).toLocaleString()}</td>
                <td>${eventIcon(e.event_type)} ${e.event_type}</td>
                <td>${e.description}</td>
                <td>${e.moisture_value != null ? Number(e.moisture_value).toFixed(1) + '%' : '--'}</td>
                <td>${e.operating_mode ?? '--'}</td>
                <td>${e.source ?? 'dashboard'}</td>
            </tr>
        `).join('') || '<tr><td colspan="6" style="color:var(--muted);text-align:center">No events yet.</td></tr>';
    }
}

// ─── API calls ────────────────────────────────────────────────────────────────
async function updateStatus() {
    try {
        const status = await fetchJson('/api/status');
        renderStatus(status);
    } catch (err) {
        setFeedback(`Status error: ${err.message}`, true);
    }
}

async function loadHistory() {
    try {
        const data = await fetchJson('/api/readings?limit=30');
        renderReadings(data.readings || []);
        renderOverviewChart(data.readings || []);
    } catch (err) {
        console.error('Readings fetch failed:', err);
    }
    try {
        const data = await fetchJson('/api/events?limit=20');
        renderEvents(data.events || []);
    } catch (err) {
        console.error('Events fetch failed:', err);
    }
}

async function simulateValue(value) {
    setFeedback('Sending…');
    try {
        const result = await fetchJson('/api/simulate', {
            method: 'POST',
            body: JSON.stringify({ moisture: value, source: 'dashboard_simulation' }),
        });
        const pump = result.status?.pump_status ?? '–';
        const soil = result.status?.soil_status ?? '–';
        setFeedback(`Moisture ${value}% → Soil: ${soil} | Pump: ${pump}`);
        await updateStatus();
        await loadHistory();
    } catch (err) {
        setFeedback(err.message, true);
    }
}

async function setMode(mode) {
    setDisabled('auto-mode-btn', true);
    setDisabled('manual-mode-btn', true);
    try {
        const result = await fetchJson('/api/mode', {
            method: 'POST',
            body: JSON.stringify({ mode }),
        });
        setFeedback(`Mode → ${result.result?.mode ?? mode}`);
        await updateStatus();
        await loadHistory();
    } catch (err) {
        setFeedback(err.message, true);
    } finally {
        setDisabled('auto-mode-btn', false);
        setDisabled('manual-mode-btn', false);
    }
}

async function manualPump(command) {
    setDisabled('pump-on-btn',  true);
    setDisabled('pump-off-btn', true);
    try {
        const result = await fetchJson('/api/control', {
            method: 'POST',
            body: JSON.stringify({ command }),
        });
        setFeedback(`Manual override → Pump ${result.result?.pump_status ?? command}`);
        await updateStatus();
        await loadHistory();
    } catch (err) {
        setFeedback(err.message, true);
    } finally {
        setDisabled('pump-on-btn',  false);
        setDisabled('pump-off-btn', false);
    }
}

// ─── Polling (Page Visibility aware) ─────────────────────────────────────────
function startPolling() {
    if (pollingInterval) return;
    pollingInterval = setInterval(async () => {
        await updateStatus();
        await loadHistory();
    }, 4000);
}

function stopPolling() {
    if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Slider — debounced simulation
    const slider = document.getElementById('moisture-slider');
    if (slider) {
        slider.addEventListener('input', e => {
            const value = Number(e.target.value);
            setText('slider-value', `${value}%`);
            clearTimeout(simulateDebounceId);
            simulateDebounceId = setTimeout(() => simulateValue(value), 200);
        });
    }

    // Mode buttons
    document.getElementById('auto-mode-btn')  ?.addEventListener('click', () => setMode('AUTOMATIC'));
    document.getElementById('manual-mode-btn')?.addEventListener('click', () => setMode('MANUAL'));

    // Pump buttons
    document.getElementById('pump-on-btn') ?.addEventListener('click', () => manualPump('ON'));
    document.getElementById('pump-off-btn')?.addEventListener('click', () => manualPump('OFF'));

    // Initial load
    await updateStatus();
    await loadHistory();

    // Page Visibility API — pause polling when tab is hidden, resume on focus
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { stopPolling(); } else { startPolling(); updateStatus(); loadHistory(); }
    });

    startPolling();
});
