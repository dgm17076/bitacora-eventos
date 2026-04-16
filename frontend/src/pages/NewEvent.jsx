import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../api';
import { Send, AlertCircle } from 'lucide-react';
import './NewEvent.css';

const initialForm = {
  title: '', description: '', category: 'otro',
  severity: 'info', source: 'manual', tags: ''
};

export default function NewEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('El título es obligatorio');

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      await eventsApi.create(payload);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el evento');
    } finally {
      setSubmitting(false);
    }
  };

  const SEVERITY_OPTS = [
    { value: 'info',     label: '● INFO',     color: 'var(--severity-info)' },
    { value: 'warning',  label: '● WARNING',  color: 'var(--severity-warning)' },
    { value: 'error',    label: '● ERROR',    color: 'var(--severity-error)' },
    { value: 'critical', label: '● CRITICAL', color: 'var(--severity-critical)' }
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Nuevo Evento</div>
        <div className="page-sub">REGISTRO EN BITÁCORA</div>
      </div>

      <div className="form-card card">
        <form onSubmit={handleSubmit}>

          {/* Severity selector */}
          <div className="form-group">
            <label className="form-label">Severidad *</label>
            <div className="sev-selector">
              {SEVERITY_OPTS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`sev-opt ${form.severity === opt.value ? 'selected' : ''}`}
                  style={{ '--sev-color': opt.color }}
                  onClick={() => setForm(f => ({ ...f, severity: opt.value }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Título *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Descripción breve del evento..."
                maxLength={200}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Categoría</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="sistema">Sistema</option>
                <option value="seguridad">Seguridad</option>
                <option value="red">Red</option>
                <option value="aplicacion">Aplicación</option>
                <option value="base_datos">Base de Datos</option>
                <option value="usuario">Usuario</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Detalles adicionales del evento..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Fuente / Origen</label>
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="manual, servidor-01, api..."
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Tags (separados por coma)</label>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="produccion, urgente, db..."
              />
            </div>
          </div>

          {error && (
            <div className="form-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/events')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={14} />
              {submitting ? 'Registrando...' : 'Registrar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
