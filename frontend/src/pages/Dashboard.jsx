import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../api';
import { AlertTriangle, CheckCircle2, AlertCircle, Info, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import './Dashboard.css';

const SEV_CONFIG = {
  info:     { label: 'INFO',     color: 'var(--severity-info)',     Icon: Info },
  warning:  { label: 'WARNING',  color: 'var(--severity-warning)',  Icon: AlertTriangle },
  error:    { label: 'ERROR',    color: 'var(--severity-error)',    Icon: AlertCircle },
  critical: { label: 'CRITICAL', color: 'var(--severity-critical)', Icon: AlertCircle }
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.get()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><span className="loading-dots">Cargando dashboard</span></div>;
  if (!stats) return <div className="page"><p>Error al cargar estadísticas</p></div>;

  const severities = ['info', 'warning', 'error', 'critical'];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">MONITOREO EN TIEMPO REAL · {new Date().toLocaleString('es-MX')}</div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-total">
          <div className="kpi-label">TOTAL EVENTOS</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card kpi-pending">
          <div className="kpi-label">PENDIENTES</div>
          <div className="kpi-value" style={{color: 'var(--accent-amber)'}}>{stats.pending}</div>
        </div>
        <div className="kpi-card kpi-resolved">
          <div className="kpi-label">RESUELTOS</div>
          <div className="kpi-value" style={{color: 'var(--accent-green)'}}>{stats.resolved}</div>
        </div>
        <div className="kpi-card kpi-rate">
          <div className="kpi-label">TASA RESOLUCIÓN</div>
          <div className="kpi-value" style={{color: 'var(--accent-cyan)'}}>
            {stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Severity breakdown */}
        <div className="card">
          <div className="card-header-label">
            <TrendingUp size={14} />
            DISTRIBUCIÓN POR SEVERIDAD
          </div>
          <div className="sev-list">
            {severities.map(sev => {
              const cfg = SEV_CONFIG[sev];
              const count = stats.bySeverity[sev] || 0;
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={sev} className="sev-row">
                  <div className="sev-label" style={{ color: cfg.color }}>
                    <cfg.Icon size={13} />
                    {cfg.label}
                  </div>
                  <div className="sev-bar-wrap">
                    <div className="sev-bar" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                  <div className="sev-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header-label">
            <Clock size={14} />
            ACTIVIDAD RECIENTE
          </div>
          {stats.recentActivity.length === 0 ? (
            <div style={{color:'var(--text-muted)',fontSize:12,padding:'16px 0'}}>Sin eventos registrados</div>
          ) : (
            <div className="recent-list">
              {stats.recentActivity.map(ev => {
                const cfg = SEV_CONFIG[ev.severity];
                return (
                  <div key={ev._id} className="recent-item">
                    <div className="recent-dot" style={{ background: cfg.color }} />
                    <div className="recent-info">
                      <div className="recent-title">{ev.title}</div>
                      <div className="recent-meta">
                        <span style={{ color: cfg.color, fontSize: 10 }}>{cfg.label}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true, locale: es })}</span>
                        {ev.resolved && <span className="resolved-chip">✓ resuelto</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/events" className="btn btn-ghost" style={{marginTop:16, width:'100%', justifyContent:'center'}}>
            Ver bitácora completa →
          </Link>
        </div>
      </div>
    </div>
  );
}
