import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';

export const dashboardController = {
  async indicadores(req: Request, res: Response) {
    res.json(await dashboardService.indicadores(req.usuario!));
  },
};
