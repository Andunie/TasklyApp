import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Container, Paper, Typography, TextField, Button, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import './AuthForm.css';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler uyuşmuyor.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ fullName: formData.fullName, email: formData.email, password: formData.password });
      toast.success('Kayıt başarılı, şimdi giriş yapabilirsiniz');
      navigate('/login');
    } catch (err) {
      const message = err?.response?.data?.message || 'Kayıt sırasında bir hata oluştu.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom>Hesap Oluştur</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>Ekibinizle görevleri yönetmeye hemen başlayın.</Typography>

        {error && <div className="error-banner">{error}</div>}

        <TextField margin="normal" fullWidth label="Ad Soyad" name="fullName" value={formData.fullName} onChange={handleChange} required />
        <TextField margin="normal" fullWidth label="E-posta Adresi" name="email" type="email" value={formData.email} onChange={handleChange} required />

        <TextField margin="normal" fullWidth label="Şifre" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required 
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" aria-label="toggle password visibility">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <TextField margin="normal" fullWidth label="Şifre Tekrar" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} required 
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" aria-label="toggle password visibility">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 1 }}>
          {loading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
        </Button>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Zaten bir hesabın var mı? <Link to="/login">Giriş Yap</Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default RegisterPage;