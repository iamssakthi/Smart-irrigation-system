import React from 'react';

export default function MetricCard({
  label,
  value,
  footer,
  icon: Icon,
  accent = 'forest',
  badge,
}) {
  return (
    <article className={`stat-card accent-${accent}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon" aria-hidden="true">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        {badge && <div style={{ marginBottom: 6 }}>{badge}</div>}
      </div>
      {footer && <div className="stat-footer">{footer}</div>}
    </article>
  );
}
