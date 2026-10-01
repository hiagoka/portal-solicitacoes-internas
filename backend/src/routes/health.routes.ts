import { Router } from 'express';
import { query } from '../config/database';

export const healthRoutes = Router();

// Verifica se a API está de pé e se consegue falar com o banco.
healthRoutes.get('/health', async (_req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok' });
});
