import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUiStore } from '../store/uiStore';

export const TopBar: React.FC = () => {
  const { theme, setTheme } = useUiStore();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  return (
    <div className="topbar">
      <div>
        <div className="tb-title">MODENACEAC · Departamento 6XSIM</div>
        <div className="tb-sub">Sistema Integral de Gestión de Simuladores de Vuelo — v2.0 React</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', opacity: 0.85 }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '11px' }}>
          LR
        </div>
        Eduardo Forgan · Instructor
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          onClick={toggleTheme} 
          title="Cambiar modo claro/oscuro" 
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </div>
  );
};
