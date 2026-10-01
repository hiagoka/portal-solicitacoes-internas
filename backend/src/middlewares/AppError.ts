// Erro "esperado" da aplicação, com código HTTP e mensagem seguros para o cliente.
// Qualquer outro erro (bug, falha do banco) vira um 500 genérico no errorHandler.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detalhes?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(msg: string, detalhes?: unknown) { return new AppError(400, msg, detalhes); }
  static unauthorized(msg = 'Não autenticado') { return new AppError(401, msg); }
  static forbidden(msg = 'Acesso negado') { return new AppError(403, msg); }
  static notFound(msg = 'Recurso não encontrado') { return new AppError(404, msg); }
  static conflict(msg: string) { return new AppError(409, msg); }
}
