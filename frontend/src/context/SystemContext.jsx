import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

const SystemContext = createContext(null);

export function SystemProvider({ children }) {
  const [status, setStatus] = useState({
    moisture: 50.0,
    soil_status: 'ADEQUATE',
    pump_status: 'OFF',
    mode: 'AUTOMATIC',
    dry_threshold: 35.0,
    wet_threshold: 45.0,
    source: 'simulated',
    data_source: 'dashboard_simulation',
    connection_status: 'SIMULATED',
    device_id: 'simulated-device',
    last_updated: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [pollingActive, setPollingActive] = useState(true);
  const [pollIntervalMs, setPollIntervalMs] = useState(3000);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Add a toast notification
  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setNotifications((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Fetch current status from backend
  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setStatus((prev) => ({
        ...prev,
        ...data,
        moisture: Number(data.moisture ?? prev.moisture),
        dry_threshold: Number(data.dry_threshold ?? data.thresholds?.dry ?? prev.dry_threshold),
        wet_threshold: Number(data.wet_threshold ?? data.thresholds?.wet ?? prev.wet_threshold),
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching system status:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger global refresh across dependent views
  const triggerGlobalRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    fetchStatus();
  }, [fetchStatus]);

  // Polling loop
  useEffect(() => {
    fetchStatus();
    if (!pollingActive) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [fetchStatus, pollingActive, pollIntervalMs]);

  // Quick simulation submission
  const simulateMoisture = useCallback(
    async (value, source = 'dashboard_simulation') => {
      try {
        const res = await api.simulateMoisture(value, source);
        await fetchStatus();
        triggerGlobalRefresh();
        return res;
      } catch (err) {
        notify(err.message, 'error');
        throw err;
      }
    },
    [fetchStatus, triggerGlobalRefresh, notify]
  );

  // Switch mode
  const switchMode = useCallback(
    async (newMode) => {
      try {
        const res = await api.setOperatingMode(newMode);
        await fetchStatus();
        notify(`Operating mode switched to ${newMode}`, 'success');
        triggerGlobalRefresh();
        return res;
      } catch (err) {
        notify(err.message, 'error');
        throw err;
      }
    },
    [fetchStatus, triggerGlobalRefresh, notify]
  );

  // Manual pump control
  const controlPump = useCallback(
    async (command) => {
      try {
        const res = await api.setManualControl(command);
        await fetchStatus();
        notify(`Simulated pump commanded: ${command}`, 'success');
        triggerGlobalRefresh();
        return res;
      } catch (err) {
        notify(err.message, 'error');
        throw err;
      }
    },
    [fetchStatus, triggerGlobalRefresh, notify]
  );

  // Update thresholds
  const updateThresholds = useCallback(
    async (dry, wet) => {
      try {
        const res = await api.updateSettings(dry, wet);
        await fetchStatus();
        notify(`Thresholds updated: Dry=${dry}%, Wet=${wet}%`, 'success');
        triggerGlobalRefresh();
        return res;
      } catch (err) {
        notify(err.message, 'error');
        throw err;
      }
    },
    [fetchStatus, triggerGlobalRefresh, notify]
  );

  // Clear history
  const clearHistory = useCallback(
    async (target = 'all') => {
      try {
        const res = await api.clearHistory(target);
        await fetchStatus();
        triggerGlobalRefresh();
        const targetLabel =
          target === 'readings' ? 'sensor readings' : target === 'events' ? 'irrigation events' : 'all history records';
        notify(
          `History cleared (${targetLabel}): ${res.deleted_readings || 0} readings, ${res.deleted_events || 0} events deleted.`,
          'success'
        );
        return res;
      } catch (err) {
        notify(`Failed to clear history: ${err.message}`, 'error');
        throw err;
      }
    },
    [fetchStatus, triggerGlobalRefresh, notify]
  );

  const value = {
    status,
    isLoading,
    error,
    notifications,
    notify,
    dismissNotification,
    pollingActive,
    setPollingActive,
    pollIntervalMs,
    setPollIntervalMs,
    refreshTrigger,
    triggerGlobalRefresh,
    fetchStatus,
    simulateMoisture,
    switchMode,
    controlPump,
    updateThresholds,
    clearHistory,
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return ctx;
}
