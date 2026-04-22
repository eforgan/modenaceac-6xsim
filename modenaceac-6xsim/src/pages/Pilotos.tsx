import React from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PIL, PB, TD } from '../data/mock';

export const Pilotos: React.FC = () => {
  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Registro de pilotos</div>
          <div className="ps">Control de habilitaciones y vencimientos psicofísicos</div>
        </div>
        <button className="btn">+ Añadir piloto</button>
      </div>

      <Card>
        <div className="table-responsive">
          <table className="tbl">
            <thead>
              <tr>
                <th>Piloto</th>
                <th>Licencia</th>
                <th>Habilitaciones de curso</th>
                <th>Psicofísico</th>
                <th>Vencimiento</th>
                <th>Total sim.</th>
                <th>Semestre</th>
                <th>Tendencia IFR</th>
              </tr>
            </thead>
            <tbody>
              {PIL.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{p.n}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gy)', fontSize: '11px' }}>{p.lic}</td>
                  <td>
                    <div className="tagr">
                      {p.hab.map(h => <Badge key={h} variant="bv">{h}</Badge>)}
                    </div>
                  </td>
                  <td>
                    <Badge variant={PB[p.ps] as any}>{p.ps.replace('_', ' ')}</Badge>
                  </td>
                  <td style={{ color: p.ps === 'VENCIDO' ? '#A32D2D' : 'inherit', fontWeight: p.ps === 'VENCIDO' ? 600 : 400 }}>{p.vc}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{p.hv}h</td>
                  <td style={{ textAlign: 'center' }}>{p.hs}h</td>
                  <td style={{ fontWeight: 600, color: TD[p.td].c, fontSize: '10px' }}>{TD[p.td].i}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
