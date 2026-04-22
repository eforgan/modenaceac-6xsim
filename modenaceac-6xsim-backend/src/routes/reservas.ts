// src/routes/reservas.ts
import { Router } from 'express';
import {
  listarReservas, crearReserva, obtenerReserva,
  actualizarReserva, cancelarReserva, semanaActual,
} from '../controllers/reservasController';

const router = Router();

router.get ('/',           listarReservas);
router.get ('/semana',     semanaActual);
router.post('/',           crearReserva);
router.get ('/:id',        obtenerReserva);
router.put ('/:id',        actualizarReserva);
router.post('/:id/cancelar', cancelarReserva);

export default router;
