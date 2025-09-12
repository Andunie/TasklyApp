import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Dosya yolunuzu kontrol edin

// Bu bileşen artık "allowedRoles" adında bir prop alacak
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Kimlik durumu yükleniyorsa, boş bir şey gösterme veya bir spinner göster
  if (isLoading) {
    return <div>Yükleniyor...</div>; // Veya daha şık bir LoadingSpinner bileşeni
  }

  // Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
  if (!user) {
    // Kullanıcıyı yönlendirdikten sonra geri dönebilmesi için state ile mevcut konumu gönderiyoruz
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kullanıcının rolü, izin verilen roller arasında mı diye kontrol et
  // Eğer allowedRoles belirtilmemişse, sadece giriş yapmış olması yeterli
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Kullanıcı giriş yapmış ama yetkisi yoksa, bir "Yetkisiz" sayfasına veya ana panele yönlendir
    return <Navigate to="/unauthorized" replace />;
  }

  // Tüm kontrollerden geçerse, istenen bileşeni (children) render et
  return children;
};

export default ProtectedRoute;
