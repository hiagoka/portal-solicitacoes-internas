import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { autenticar } from '../middlewares/autenticar';

export const dashboardRoutes = Router();

dashboardRoutes.get('/dashboard', autenticar, dashboardController.indicadores);
