// src/routes/mantenimiento.ts
import { Router } from 'express';
import {
  listarTareas, crearTarea, actualizarTarea,
  completarTarea, alertasVencidas, historial,
} from '../controllers/mantenimientoController';

const router = Router();

router.get ('/',               listarTareas);
router.get ('/alertas',        alertasVencidas);
router.post('/',               crearTarea);
router.put ('/:id',            actualizarTarea);
router.post('/:id/completar',  completarTarea);
router.get ('/:id/historial',  historial);

export default router;
