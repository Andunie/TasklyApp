import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Container, Paper, Typography, TextField, Button, Checkbox, FormControlLabel, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import './AuthForm.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    setError('');
    setLoading(true);
      try {
        const authUser = await login({ email: formData.email, password: formData.password, rememberMe: formData.rememberMe });
        toast.success('Giriş başarılı');
        if (authUser?.role === 'Admin') navigate('/admin'); else navigate('/app');
    } catch (err) {
      const message = err?.response?.data?.message || 'E-posta veya şifre hatalı.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom>Giriş Yap</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>Hoş geldiniz! Görevlerinize devam edin.</Typography>
        {error && <div className="error-banner">{error}</div>}

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

        <FormControlLabel control={<Checkbox name="rememberMe" checked={formData.rememberMe} onChange={handleChange} />} label="Beni Hatırla" />

        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 1 }}>
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </Button>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Şifremi unuttum? &nbsp;|&nbsp; Hesabın yok mu? <Link to="/register">Kayıt Ol</Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default LoginPage;