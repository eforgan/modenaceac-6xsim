import React from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { CUR, NB } from '../data/mock';

export const Cursos: React.FC = () => {
  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Cursos y Habilitaciones</div>
          <div className="ps">Catálogo de entrenamientos aprobados y syllabus predefinido</div>
        </div>
      </div>

      <Card>
        <div className="table-responsive">
          <table className="tbl">
            <thead>
              <tr>
                <th>Denominación del curso</th>
                <th>Aeronave</th>
                <th>Nivel</th>
                <th>Horas teóricas</th>
                <th>Módulos sim.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {CUR.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{c.n}</td>
                  <td><Badge variant="bco">{c.a}</Badge></td>
                  <td><Badge variant={NB[c.nv] as any}>{c.nv}</Badge></td>
                  <td style={{ textAlign: 'center' }}>{c.h} h</td>
                  <td style={{ textAlign: 'center' }}>{c.m} ses.</td>
                  <td>
                    <button className="btn" style={{ padding: '6px 12px', fontSize: '10px' }}>Ver Syllabus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
