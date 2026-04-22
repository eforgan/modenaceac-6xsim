// src/routes/sesiones.ts
import { Router } from 'express';
import {
  listarSesiones, crearSesion, obtenerSesion,
  actualizarSesion, finalizarSesion, generarPDF,
} from '../controllers/sesionesController';

const router = Router();

router.get ('/',            listarSesiones);
router.post('/',            crearSesion);
router.get ('/:id',         obtenerSesion);
router.put ('/:id',         actualizarSesion);
router.post('/:id/finalizar', finalizarSesion);
router.post('/:id/pdf',     generarPDF);

export default router;
