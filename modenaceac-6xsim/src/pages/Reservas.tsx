import React from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { RES, EB } from '../data/mock';

export const Reservas: React.FC = () => {
  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Calendario de reservas</div>
          <div className="ps">Gestión de tiempos e instructores de los simuladores</div>
        </div>
        <button className="btn btnp">+ Nueva reserva</button>
      </div>

      <Card>
        <div className="wtabs">
          <div className="wt on"><div className="dn">HOY</div><div className="dd">21 Abr</div></div>
          <div className="wt"><div className="dn">MAÑANA</div><div className="dd">22 Abr</div></div>
          <div className="wt"><div className="dn">JUE</div><div className="dd">23 Abr</div></div>
          <div className="wt"><div className="dn">VIE</div><div className="dd">24 Abr</div></div>
          <div className="wt"><div className="dn">SAB</div><div className="dd">25 Abr</div></div>
          <div className="wt" style={{ opacity: 0.5 }}><div className="dn">LUN</div><div className="dd">27 Abr</div></div>
        </div>

        <div className="table-responsive">
          <table className="tbl">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Duración</th>
                <th>Sim.</th>
                <th>Tipo</th>
                <th>Piloto</th>
                <th>Instructor</th>
                <th>Tema / Maniobra predefinida</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {RES.filter(r => r.day === 0).map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.ini}</td>
                  <td>{r.dur} min</td>
                  <td><b>{r.sim}</b></td>
                  <td><Badge variant={r.tipo === 'VUELO' ? 'bc' : (r.tipo === 'DEMO' ? 'bco' : 'bp')}>{r.tipo}</Badge></td>
                  <td>{r.pil || <span style={{ color: 'var(--gy)', fontStyle: 'italic' }}>Sin asignar</span>}</td>
                  <td>{r.ins}</td>
                  <td style={{ color: 'var(--text-m)', fontSize: '11px' }}>{r.tema}</td>
                  <td><Badge variant={EB[r.est] as any}>{r.est}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div style={{ marginTop: '16px', fontSize: '10px', color: 'var(--gy)', textAlign: 'right' }}>
        * Las sesiones EN CURSO bloquean temporalmente el puerto 49001 UDP.
      </div>
    </div>
  );
};
