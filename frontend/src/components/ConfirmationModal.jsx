import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, ShieldCheck } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Clear Historical Data',
  isDeleting = false,
  showTargetOptions = true,
}) {
  const [target, setTarget] = useState('all');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => !isDeleting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'var(--ts-error-bg)',
                color: 'var(--ts-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 id="modal-title" style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ts-text-primary)' }}>
                {title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ts-text-secondary)' }}>Destructive database operation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ts-text-muted)',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              padding: 4,
            }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 20, fontSize: '0.875rem', color: 'var(--ts-text-secondary)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 12 }}>
            Are you sure you want to proceed with deleting historical records? This operation removes selected data from the SQLite database and cannot be undone.
          </p>

          <div
            style={{
              background: 'var(--ts-bg-subtle-green)',
              border: '1px solid var(--ts-border-green)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.8125rem',
              color: 'var(--ts-text-primary)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <ShieldCheck size={18} color="var(--ts-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Protected configuration:</strong> Your threshold parameters (dry/adequate moisture), operating mode, and simulation settings are safe and will <em>not</em> be deleted.
            </div>
          </div>

          {showTargetOptions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ts-text-primary)' }}>
                Select records to clear:
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: target === 'all' ? 'var(--ts-bg-subtle-green)' : 'var(--ts-surface-muted)',
                  border: `1px solid ${target === 'all' ? 'var(--ts-primary)' : 'var(--ts-border)'}`,
                  cursor: 'pointer',
                  transition: 'border-color var(--trans-fast)',
                }}
              >
                <input
                  type="radio"
                  name="clear-target"
                  value="all"
                  checked={target === 'all'}
                  onChange={() => setTarget('all')}
                  disabled={isDeleting}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ts-text-primary)', fontSize: '0.875rem' }}>
                    Clear Both Readings & Events
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ts-text-secondary)' }}>
                    Resets historical telemetry charts, tables, and the controller audit log.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: target === 'readings' ? 'var(--ts-bg-subtle-green)' : 'var(--ts-surface-muted)',
                  border: `1px solid ${target === 'readings' ? 'var(--ts-primary)' : 'var(--ts-border)'}`,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="clear-target"
                  value="readings"
                  checked={target === 'readings'}
                  onChange={() => setTarget('readings')}
                  disabled={isDeleting}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ts-text-primary)', fontSize: '0.875rem' }}>
                    Clear Sensor Readings Only
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ts-text-secondary)' }}>
                    Clears soil moisture data points; preserves the irrigation event timeline.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: target === 'events' ? 'var(--ts-bg-subtle-green)' : 'var(--ts-surface-muted)',
                  border: `1px solid ${target === 'events' ? 'var(--ts-primary)' : 'var(--ts-border)'}`,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="clear-target"
                  value="events"
                  checked={target === 'events'}
                  onChange={() => setTarget('events')}
                  disabled={isDeleting}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ts-text-primary)', fontSize: '0.875rem' }}>
                    Clear Irrigation Events Only
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ts-text-secondary)' }}>
                    Clears state transitions; preserves historical moisture charts.
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-destructive"
            onClick={() => onConfirm(target)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Clearing...
              </>
            ) : (
              <>
                <Trash2 size={16} /> Confirm Deletion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
