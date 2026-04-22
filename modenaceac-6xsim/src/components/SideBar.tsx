import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarDays, MonitorPlay, FileCheck2, 
  Wrench, Users, GraduationCap, FileLineChart, PenTool, BarChart3
} from 'lucide-react';
import { NAV } from '../data/mock';

const IconMap: Record<string, React.ReactNode> = {
  dash: <LayoutDashboard size={18} />,
  res: <CalendarDays size={18} />,
  ses: <MonitorPlay size={18} />,
  rep: <FileCheck2 size={18} />,
  log: <Wrench size={18} />,
  pil: <Users size={18} />,
  cur: <GraduationCap size={18} />,
  anac: <FileLineChart size={18} />,
  mant: <PenTool size={18} />,
  stats: <BarChart3 size={18} />
};

export const SideBar: React.FC = () => {
  const sections = Array.from(new Set(NAV.map(n => n.sec)));

  return (
    <>
      <div className="sidebar">
        {sections.map(sec => (
          <React.Fragment key={sec}>
            <div className="ns">{sec}</div>
            {NAV.filter(n => n.sec === sec).map(n => (
              <NavLink
                key={n.id}
                to={n.id === 'dash' ? '/' : `/${n.id}`}
                className={({ isActive }) => `ni ${isActive ? 'on' : ''}`}
              >
                {IconMap[n.id]}
                {n.lbl}
              </NavLink>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="bottom-bar">
        {NAV.map(n => (
          <NavLink
            key={n.id}
            to={n.id === 'dash' ? '/' : `/${n.id}`}
            className={({ isActive }) => `bottom-item ${isActive ? 'on' : ''}`}
          >
            {IconMap[n.id]}
            <span style={{ fontSize: '9px' }}>{n.lbl}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
};
