import React, { useEffect, useState, useCallback } from 'react';
import { eventsApi } from '../api';
import { Search, Plus, Trash2, CheckCircle, Circle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import './EventList.css';

const SEVERITY_COLORS = {
  info: 'var(--severity-info)',
  warning: 'var(--severity-warning)',
  error: 'var(--severity-error)',
  critical: 'var(--severity-critical)'
};

const CATEGORY_LABELS = {
  sistema: 'Sistema', seguridad: 'Seguridad', red: 'Red',
  aplicacion: 'Aplicación', base_datos: 'Base de Datos',
  usuario: 'Usuario', otro: 'Otro'
};

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', severity: '', category: '', resolved: '' });
  const [deleting, setDeleting] = useState(null);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15, ...filters };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    eventsApi.getAll(params)
      .then(r => {
        setEvents(r.data.events);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const handleResolve = async (id) => {
    await eventsApi.resolve(id);
    fetchEvents();
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    await eventsApi.delete(id);
    fetchEvents();
    setDeleting(null);
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Bitácora</div>
          <div className="page-sub">{total} EVENTOS REGISTRADOS</div>
        </div>
        <Link to="/new" className="btn btn-primary">
          <Plus size={14} /> Nuevo Evento
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={filters.search}
            onChange={e => handleFilter('search', e.target.value)}
            className="search-input"
          />
        </div>
        <select value={filters.severity} onChange={e => handleFilter('severity', e.target.value)}>
          <option value="">Todas las severidades</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <select value={filters.category} onChange={e => handleFilter('category', e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filters.resolved} onChange={e => handleFilter('resolved', e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="false">Pendientes</option>
          <option value="true">Resueltos</option>
        </select>
        <button className="btn btn-ghost" onClick={fetchEvents} title="Refrescar">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={40} /></div>
            <h3>Sin eventos</h3>
            <p>No se encontraron eventos con los filtros seleccionados</p>
          </div>
        ) : (
          <table className="events-table">
            <thead>
              <tr>
                <th>SEVERIDAD</th>
                <th>TÍTULO</th>
                <th>CATEGORÍA</th>
                <th>FUENTE</th>
                <th>FECHA</th>
                <th>ESTADO</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev._id} className={ev.resolved ? 'resolved-row' : ''}>
                  <td>
                    <span className={`badge badge-${ev.severity}`}>{ev.severity}</span>
                  </td>
                  <td className="title-cell">{ev.title}</td>
                  <td><span className="cat-chip">{CATEGORY_LABELS[ev.category] || ev.category}</span></td>
                  <td className="source-cell">{ev.source}</td>
                  <td className="date-cell">
                    {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true, locale: es })}
                  </td>
                  <td>
                    <button
                      className={`resolve-btn ${ev.resolved ? 'resolved' : ''}`}
                      onClick={() => handleResolve(ev._id)}
                      title={ev.resolved ? 'Reabrir' : 'Marcar como resuelto'}
                    >
                      {ev.resolved ? <CheckCircle size={15} /> : <Circle size={15} />}
                      {ev.resolved ? 'Resuelto' : 'Pendiente'}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '5px 10px', fontSize: 11 }}
                      onClick={() => handleDelete(ev._id)}
                      disabled={deleting === ev._id}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Anterior</button>
          <span className="page-info">Página {page} de {pages}</span>
          <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page === pages}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}
