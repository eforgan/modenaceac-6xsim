// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const ok = await bcrypt.compare(password, usuario.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign(
      { userId: usuario.id, rol: usuario.rol, nombre: `${usuario.nombre} ${usuario.apellido}` },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' },
    );

    logger.info(`Login: ${email} (${usuario.rol})`);
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, rol: usuario.rol } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, nombre: true, apellido: true, email: true, rol: true, createdAt: true },
    });
    if (!usuario) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    res.json(usuario);
  } catch (err) { next(err); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { actual, nueva } = z.object({
      actual: z.string().min(6),
      nueva:  z.string().min(8),
    }).parse(req.body);

    const usuario = await prisma.usuario.findUnique({ where: { id: req.user!.userId } });
    if (!usuario) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

    const ok = await bcrypt.compare(actual, usuario.passwordHash);
    if (!ok) { res.status(400).json({ error: 'Contraseña actual incorrecta' }); return; }

    const hash = await bcrypt.hash(nueva, 12);
    await prisma.usuario.update({ where: { id: req.user!.userId }, data: { passwordHash: hash } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
