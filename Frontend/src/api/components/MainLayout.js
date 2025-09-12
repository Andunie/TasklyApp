import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MainLayout.css';

const MainLayout = () => {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Taskly</h3>
        </div>
        <nav className="sidebar-nav">
          {/* Admin ve User için ortak linkler */}
          <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"}>Dashboard</Link>
          <Link to="/tasks">Görevlerim</Link>

          {/* Sadece Admin'in göreceği linkler */}
          {isAdmin && (
            <>
              <Link to="/admin/users">Kullanıcılar</Link>
              <Link to="/admin/reports">Raporlar</Link>
            </>
          )}

          <Link to="/settings">Ayarlar</Link>
        </nav>
      </aside>
      <main className="main-content">
        <header className="main-header">
          <div className="user-info">
            Hoş geldin, {user?.name || 'Kullanıcı'}
          </div>
          <button onClick={logout} className="logout-button">
            Çıkış Yap
          </button>
        </header>
        <div className="page-content">
          {/* Sayfanın asıl içeriği burada render edilecek */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;