import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // AuthContext dosyanızın yolunu kontrol edin

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Kimlik durumu yükleniyorsa, bir yüklenme göstergesi gösterelim.
  // Bu, sayfa yenilendiğinde anlık olarak login sayfasına yönlenmeyi önler.
  if (isLoading) {
    return <div>Yükleniyor...</div>; 
  }

  // Yüklenme bittiğinde, kullanıcı yoksa login sayfasına yönlendir.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kullanıcı varsa, istenen sayfayı (child route) göster.
  // <Outlet />, parent route'un içindeki child route'ları render eder.
  return <Outlet />;
};

export default ProtectedRoute;