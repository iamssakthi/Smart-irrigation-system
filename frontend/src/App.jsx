import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SystemProvider } from './context/SystemContext';
import Layout from './components/Layout';

import Overview from './pages/Overview';
import LiveMonitoring from './pages/LiveMonitoring';
import SimulationLab from './pages/SimulationLab';
import History from './pages/History';
import Events from './pages/Events';
import Settings from './pages/Settings';
import SystemInfo from './pages/SystemInfo';

export default function App() {
  return (
    <SystemProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="overview" element={<Navigate to="/" replace />} />
            <Route path="monitoring" element={<LiveMonitoring />} />
            <Route path="simulation" element={<SimulationLab />} />
            <Route path="history" element={<History />} />
            <Route path="events" element={<Events />} />
            <Route path="settings" element={<Settings />} />
            <Route path="configuration" element={<Settings />} />
            <Route path="system-info" element={<SystemInfo />} />
            <Route path="about" element={<Navigate to="/system-info" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SystemProvider>
  );
}
