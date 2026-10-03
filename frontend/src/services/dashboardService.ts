import type { Indicadores } from '@/types'
import { http } from './httpClient'

export const dashboardService = {
  indicadores: () => http.get<Indicadores>('/dashboard'),
}
