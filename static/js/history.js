/**
 * history.js — History page controller.
 * Depends on: shared.js (fetchJson), Chart.js (chart.umd.min.js)
 */

let historyChart = null;
let liveDryThreshold = 35;
let liveWetThreshold = 45;

// ─── Chart ────────────────────────────────────────────────────────────────────
function renderChart(readings) {
    const ctx        = document.getElementById('history-chart');
    const emptyState = document.getElementById('history-chart-empty');
    if (!ctx) return;

    // ── UI-7 FIX: null/empty guard BEFORE touching readings.length ─────────
    if (!readings || readings.length === 0) {
        if (historyChart) { historyChart.destroy(); historyChart = null; }
        emptyState?.classList.remove('hidden');
        ctx.classList.add('hidden');
        return;
    }

    emptyState?.classList.add('hidden');
    ctx.classList.remove('hidden');

    // Threshold arrays created AFTER the null guard
    const ordered       = readings.slice().reverse();
    const labels        = ordered.map(r => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const moisture      = ordered.map(r => Number(r.soil_moisture));
    const pumpLine      = ordered.map(r => r.pump_status === 'ON' ? 1 : 0);
    // Use live thresholds — never hardcoded
    const dryThreshold  = new Array(ordered.length).fill(liveDryThreshold);
    const wetThreshold  = new Array(ordered.length).fill(liveWetThreshold);

    if (historyChart) {
        historyChart.data.labels                   = labels;
        historyChart.data.datasets[0].data         = moisture;
        historyChart.data.datasets[1].data         = pumpLine;
        historyChart.data.datasets[2].data         = dryThreshold;
        historyChart.data.datasets[3].data         = wetThreshold;
        historyChart.update('none');
        return;
    }

    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Moisture (%)',
                    data: moisture,
                    borderColor: '#2d7a4a',
                    backgroundColor: 'rgba(45, 122, 74, 0.10)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    yAxisID: 'y',
                },
                {
                    label: 'Pump (ON=1)',
                    data: pumpLine,
                    borderColor: '#2d7ae6',
                    backgroundColor: 'rgba(45, 122, 230, 0.07)',
                    fill: true,
                    tension: 0,
                    pointRadius: 0,
                    borderWidth: 2,
                    stepped: true,
                    yAxisID: 'yPump',
                },
                {
                    label: `Dry threshold (${liveDryThreshold}%)`,
                    data: dryThreshold,
                    borderColor: '#d9534f',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    borderWidth: 1.5,
                    yAxisID: 'y',
                },
                {
                    label: `Wet threshold (${liveWetThreshold}%)`,
                    data: wetThreshold,
                    borderColor: '#eebf41',
                    borderDash: [5, 5],
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
                x: { title: { display: true, text: 'Time' } },
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

// ─── Table ────────────────────────────────────────────────────────────────────
function renderTable(readings) {
    const body = document.getElementById('history-table-body');
    if (!body) return;

    if (!readings || readings.length === 0) {
        body.innerHTML = '<tr><td colspan="7" style="color:var(--muted);text-align:center">No records yet. Simulate a moisture value to populate history.</td></tr>';
        return;
    }

    // Show all returned rows (limit is set by the API call, not capped here)
    body.innerHTML = readings.map(r => `
        <tr>
            <td>${new Date(r.timestamp).toLocaleString()}</td>
            <td>${r.device_id || 'simulated-device'}</td>
            <td>${Number(r.soil_moisture).toFixed(1)}%</td>
            <td><span class="state-badge state-${(r.soil_status || '').toLowerCase()}">${r.soil_status}</span></td>
            <td><span class="pump-badge pump-${(r.pump_status || 'off').toLowerCase()}">${r.pump_status}</span></td>
            <td>${r.operating_mode}</td>
            <td>${r.source}</td>
        </tr>
    `).join('');
}

// ─── Feedback ────────────────────────────────────────────────────────────────
function setHistoryFeedback(message, isError = false) {
    const el = document.getElementById('history-feedback');
    if (!el) return;
    el.textContent = message;
    el.className = 'feedback' + (isError ? ' feedback-error' : '');
}

// ─── Data load ────────────────────────────────────────────────────────────────
async function loadThresholds() {
    try {
        const status = await fetchJson('/api/status');
        liveDryThreshold = Number(status.dry_threshold ?? 35);
        liveWetThreshold = Number(status.wet_threshold ?? 45);
    } catch (_) {
        // Thresholds will remain at defaults; non-fatal
    }
}

async function refreshHistoryView() {
    await loadThresholds();
    const data     = await fetchJson('/api/readings?limit=50');
    const readings = data.readings || [];
    renderChart(readings);
    renderTable(readings);
}

async function clearHistory() {
    try {
        const result = await fetchJson('/api/history/clear', { method: 'POST' });
        await refreshHistoryView();
        setHistoryFeedback(
            `Cleared — removed ${result.deleted_readings} reading(s) and ${result.deleted_events} event(s).`
        );
    } catch (err) {
        setHistoryFeedback(err.message, true);
    }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('clear-history-btn')?.addEventListener('click', async () => {
        if (window.confirm('Clear all historical readings and events?')) {
            await clearHistory();
        }
    });

    try {
        await refreshHistoryView();
    } catch (err) {
        setHistoryFeedback(err.message, true);
    }
});
