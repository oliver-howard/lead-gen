import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Mail, BarChart2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="dot" />
            LeadGen
          </div>

          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>

          <NavLink to="/discover" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Search size={16} /> Discover
          </NavLink>

          <NavLink to="/emails" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Mail size={16} /> Emails
          </NavLink>

          <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart2 size={16} /> Analytics
          </NavLink>
        </aside>

        {/* Main */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/discover" element={<Discover />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
