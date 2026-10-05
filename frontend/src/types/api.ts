// Detalhe de um campo inválido, devolvido pela API em respostas 400.
export interface ErroCampo {
  campo: string
  mensagem: string
}

// Formato padrão de erro da API: { erro, detalhes? }
export interface ErroApi {
  erro: string
  detalhes?: ErroCampo[]
  /** ID da requisição, presente nos erros 500: liga o erro ao log do servidor. */
  idRequisicao?: string
}
