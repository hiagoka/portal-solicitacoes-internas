export type Perfil = 'solicitante' | 'atendente';

// Linha da tabela `usuarios`, exatamente como vem do banco.
export interface UsuarioRow {
  id: number;
  nome: string;
  usuario: string;
  senha_hash: string;
  perfil: Perfil;
  criado_em: Date;
}

// Versão segura para devolver ao cliente: nunca inclui a senha.
export type UsuarioPublico = Pick<UsuarioRow, 'id' | 'nome' | 'usuario' | 'perfil'>;
