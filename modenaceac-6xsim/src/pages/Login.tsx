import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, auth } from '../services/api';

export const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      auth.setToken(res.token);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: 'var(--font)',
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--gyb)', borderRadius: '20px',
        padding: '40px', width: '360px', boxShadow: 'var(--shadow)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            MODENACEAC · 6XSIM
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gy)' }}>Sistema de Gestión de Simuladores</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="usuario@modenaceac.mil.ar"
              style={{
                width: '100%', padding: '10px 14px', border: '0.5px solid var(--gyb)',
                borderRadius: '10px', fontSize: '13px', background: 'var(--bg-input)',
                color: 'var(--text)', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', border: '0.5px solid var(--gyb)',
                borderRadius: '10px', fontSize: '13px', background: 'var(--bg-input)',
                color: 'var(--text)', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '8px',
              padding: '10px 14px', fontSize: '12px', color: '#A32D2D',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btnp"
            style={{ width: '100%', padding: '12px', marginTop: '4px', fontSize: '13px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '10px', color: 'var(--gy)' }}>
          Acceso restringido · Personal autorizado MODENACEAC
        </div>
      </div>
    </div>
  );
};
