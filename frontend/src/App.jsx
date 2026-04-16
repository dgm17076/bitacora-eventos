import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Plus, Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import NewEvent from './pages/NewEvent';
import './App.css';

function Nav() {
  const location = useLocation();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Activity size={18} />
        </div>
        <div>
          <div className="brand-title">BITÁCORA</div>
          <div className="brand-sub">Sistema de Eventos</div>
        </div>
      </div>

      <div className="sidebar-status">
        <span className="status-dot"></span>
        <span>SISTEMA ACTIVO</span>
      </div>

      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/events" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ScrollText size={16} />
          <span>Bitácora</span>
        </NavLink>
        <NavLink to="/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Plus size={16} />
          <span>Nuevo Evento</span>
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div className="footer-line">v1.0.0 · DevOps Project</div>
        <div className="footer-line">{new Date().toLocaleDateString('es-MX')}</div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Nav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/new" element={<NewEvent />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
