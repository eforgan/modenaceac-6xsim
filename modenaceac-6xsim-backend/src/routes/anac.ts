// src/routes/anac.ts
import { Router } from 'express';
import { exportarANAC, estadisticasANAC, sesionesParaExportar } from '../controllers/anacController';
import { requireRol } from '../middleware/auth';

const router = Router();

// Requiere rol ADMIN, DIRECCION o ANAC
router.get ('/sesiones',     sesionesParaExportar);
router.get ('/estadisticas', estadisticasANAC);
router.post('/exportar',     requireRol('ADMIN','DIRECCION','ANAC'), exportarANAC);

export default router;
