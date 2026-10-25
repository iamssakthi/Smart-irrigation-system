/**
 * API client for the Smart Irrigation System Backend.
 * Automatically handles JSON serialization, query string building, and HTTP error catching.
 */

const BASE_URL = '';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = (typeof data === 'object' && data?.error) || response.statusText || 'API request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Status of controller, current moisture, thresholds, pump status, mode
  async getStatus() {
    return request('/api/status');
  },

  // Historical sensor readings with optional filtering
  async getReadings(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.source && params.source !== 'all') query.append('source', params.source);
    if (params.soil_status && params.soil_status !== 'all') query.append('soil_status', params.soil_status);
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return request(`/api/readings${qs ? `?${qs}` : ''}`);
  },

  // Historical irrigation and system events
  async getEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.event_type && params.event_type !== 'all') query.append('event_type', params.event_type);
    const qs = query.toString();
    return request(`/api/events${qs ? `?${qs}` : ''}`);
  },

  // Submit simulated soil moisture reading
  async simulateMoisture(moisture, source = 'dashboard_simulation') {
    return request('/api/simulate', {
      method: 'POST',
      body: JSON.stringify({ moisture: Number(moisture), source }),
    });
  },

  // Manual pump control ("ON" | "OFF")
  async setManualControl(command) {
    return request('/api/control', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  },

  // Switch operating mode ("AUTOMATIC" | "MANUAL")
  async setOperatingMode(mode) {
    return request('/api/mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  },

  // Update hysteresis thresholds
  async updateSettings(dryThreshold, wetThreshold) {
    return request('/api/settings', {
      method: 'POST',
      body: JSON.stringify({
        dry_threshold: Number(dryThreshold),
        wet_threshold: Number(wetThreshold),
      }),
    });
  },

  // Submit raw telemetry payload (Wokwi / IoT format)
  async sendTelemetry(payload) {
    return request('/api/telemetry', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Clear history records safely (readings, events, or all)
  async clearHistory(target = 'all') {
    return request('/api/history/clear', {
      method: 'POST',
      body: JSON.stringify({ target }),
    });
  },

  // Reset demo database to factory baseline
  async resetDemo() {
    return request('/reset-demo');
  },
};
