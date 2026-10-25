import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  FlaskConical,
  History,
  CalendarCheck,
  Settings,
  Info,
  Menu,
  X,
  Sprout,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info as InfoIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import ConfirmationModal from './ConfirmationModal';
import { api } from '../api/client';

export default function Layout() {
  const { status, notifications, dismissNotification, notify, triggerGlobalRefresh, switchMode } = useSystem();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Live Monitoring', path: '/monitoring', icon: Activity },
    { name: 'Virtual Field Lab', path: '/simulation', icon: FlaskConical },
    { name: 'History & Analytics', path: '/history', icon: History },
    { name: 'Irrigation Events', path: '/events', icon: CalendarCheck },
    { name: 'Configuration', path: '/settings', icon: Settings },
    { name: 'System Information', path: '/system-info', icon: Info },
  ];

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemo();
      setIsResetModalOpen(false);
      triggerGlobalRefresh();
      notify('Demo data has been reset to baseline defaults.', 'success');
    } catch (err) {
      notify(`Reset failed: ${err.message}`, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const getPageTitle = () => {
    const item = navItems.find((n) => n.path === location.pathname);
    return item ? item.name : 'TerraSense IQ';
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <Sprout size={22} />
          </div>
          <div className="brand-info">
            <h1 className="brand-title">TerraSense IQ</h1>
            <p className="brand-subtitle">Smart Agriculture</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="system-status-indicator">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pulse-dot" />
              <span>Simulated Engine Active</span>
            </div>
            <button
              onClick={() => setIsResetModalOpen(true)}
              title="Reset Demo Baseline"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ts-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
                borderRadius: 'var(--radius-xs)',
              }}
              aria-label="Reset Demo Database"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="topbar-header">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="page-title-crumbs">
              <span>{getPageTitle()}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Simulation tag */}
            <span
              className="badge badge-gray"
              style={{ display: 'none', md: 'inline-flex', fontSize: '0.72rem' }}
              title="No physical hardware connected"
            >
              Virtual Field Lab
            </span>

            {/* Mode badge with toggle */}
            <button
              type="button"
              className={`badge ${status.mode === 'MANUAL' ? 'badge-amber' : 'badge-green'}`}
              style={{ cursor: 'pointer', border: '1px solid currentColor' }}
              onClick={() => switchMode(status.mode === 'AUTOMATIC' ? 'MANUAL' : 'AUTOMATIC')}
              title={`Click to switch to ${status.mode === 'AUTOMATIC' ? 'MANUAL' : 'AUTOMATIC'} mode`}
            >
              Mode: {status.mode}
            </button>

            {/* Pump status badge */}
            <span className={`badge ${status.pump_status === 'ON' ? 'badge-blue' : 'badge-gray'}`}>
              <Power size={12} style={{ marginRight: 2 }} />
              Pump: {status.pump_status}
            </span>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Reset button in header */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setIsResetModalOpen(true)}
            >
              <RotateCcw size={13} /> Reset Demo
            </button>
          </div>
        </header>

        <main className="content-body">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications container */}
      <div className="toast-container" role="status" aria-live="polite">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`toast toast-${n.type}`}
            onClick={() => dismissNotification(n.id)}
            title="Click to dismiss"
          >
            {n.type === 'success' && <CheckCircle2 size={18} color="var(--ts-secondary)" />}
            {n.type === 'error' && <AlertCircle size={18} color="var(--ts-error)" />}
            {n.type === 'info' && <InfoIcon size={18} color="var(--ts-info)" />}
            <span style={{ fontSize: '0.825rem', color: 'var(--ts-text-primary)' }}>{n.message}</span>
          </div>
        ))}
      </div>

      {/* Reset Demo Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetDemo}
        title="Reset Demo Database"
        isDeleting={isResetting}
        showTargetOptions={false}
      />
    </div>
  );
}
