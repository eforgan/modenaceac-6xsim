import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { SideBar } from './components/SideBar';
import { Dashboard } from './pages/Dashboard';
import { Reservas } from './pages/Reservas';
import { SesionActiva } from './pages/SesionActiva';
import { Reportes } from './pages/Reportes';
import { LogTecnico } from './pages/LogTecnico';
import { Pilotos } from './pages/Pilotos';
import { Cursos } from './pages/Cursos';
import { StatusMonitor } from './pages/StatusMonitor';
import { Mantenimiento } from './pages/Mantenimiento';
import { ExportAnac } from './pages/ExportAnac';
import { Login } from './pages/Login';
import { auth } from './services/api';

import './index.css';

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <TopBar />
    <div className="layout">
      <SideBar />
      <div className="main">
        {children}
      </div>
    </div>
  </>
);

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  if (!auth.isLoggedIn()) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/status" element={<StatusMonitor />} />

        {/* Rutas protegidas */}
        <Route path="*" element={
          <RequireAuth>
            <MainLayout>
              <Routes>
                <Route path="/"     element={<Dashboard />} />
                <Route path="/res"  element={<Reservas />} />
                <Route path="/ses"  element={<SesionActiva />} />
                <Route path="/rep"  element={<Reportes />} />
                <Route path="/log"  element={<LogTecnico />} />
                <Route path="/pil"  element={<Pilotos />} />
                <Route path="/cur"  element={<Cursos />} />
                <Route path="/anac" element={<ExportAnac />} />
                <Route path="/mant" element={<Mantenimiento />} />
                <Route path="*"     element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
