// src/routes/pilotos.ts
import { Router } from 'express';
import {
  listarPilotos, crearPiloto, obtenerPiloto,
  actualizarPiloto, estadisticasPiloto,
} from '../controllers/pilotosController';

const router = Router();

router.get ('/',                    listarPilotos);
router.post('/',                    crearPiloto);
router.get ('/:id',                 obtenerPiloto);
router.put ('/:id',                 actualizarPiloto);
router.get ('/:id/estadisticas',    estadisticasPiloto);

export default router;
