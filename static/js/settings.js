/**
 * settings.js — Settings page controller.
 * Depends on: shared.js (fetchJson)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('settings-form');
    const feedback = document.getElementById('settings-feedback');
    const dryInput = document.getElementById('dry-threshold-input');
    const wetInput = document.getElementById('wet-threshold-input');

    try {
        const status = await fetchJson('/api/status');
        dryInput.value = Number(status.dry_threshold).toFixed(0);
        wetInput.value = Number(status.wet_threshold).toFixed(0);
    } catch (error) {
        if (feedback) feedback.textContent = error.message;
    }

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const payload = {
                dry_threshold: Number(dryInput.value),
                wet_threshold: Number(wetInput.value),
            };

            try {
                const result = await fetchJson('/api/settings', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                if (feedback) feedback.textContent = `Thresholds saved: dry ${result.dry_threshold}, wet ${result.wet_threshold}`;
            } catch (error) {
                if (feedback) {
                    feedback.textContent = error.message;
                    feedback.style.color = '#d9534f';
                }
            }
        });
    }

    const resetButton = document.getElementById('reset-settings');
    if (resetButton) {
        resetButton.addEventListener('click', async () => {
            dryInput.value = '35';
            wetInput.value = '45';
            try {
                const result = await fetchJson('/api/settings', {
                    method: 'POST',
                    body: JSON.stringify({ dry_threshold: 35, wet_threshold: 45 }),
                });
                if (feedback) feedback.textContent = `Defaults restored: dry ${result.dry_threshold}, wet ${result.wet_threshold}`;
            } catch (error) {
                if (feedback) feedback.textContent = error.message;
            }
        });
    }
});
