export type Perfil = 'solicitante' | 'atendente'

export interface Usuario {
  id: number
  nome: string
  usuario: string
  perfil: Perfil
}
