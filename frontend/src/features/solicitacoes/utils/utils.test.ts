import { describe, expect, it } from 'vitest'
import type { Solicitacao, Usuario } from '@/types'
import { podeEditarOuExcluir, podeMudarStatus } from './permissoes'
import { validarSolicitacao, type ValoresFormulario } from './validacao'

const maria: Usuario = { id: 2, nome: 'Maria', usuario: 'maria', perfil: 'solicitante' }
const joao: Usuario = { id: 3, nome: 'João', usuario: 'joao', perfil: 'solicitante' }
const ana: Usuario = { id: 1, nome: 'Ana', usuario: 'atendente', perfil: 'atendente' }

const solicitacao = (status: Solicitacao['status']): Solicitacao => ({
  id: 1, titulo: 't', descricao: 'd', categoria: 'TI', status, criadoEm: '', atualizadoEm: '',
  solicitante: { id: 2, nome: 'Maria' },
})

describe('permissões da interface', () => {
  it('só o autor edita/exclui, e só se estiver aberta', () => {
    expect(podeEditarOuExcluir(maria, solicitacao('aberto'))).toBe(true)
    expect(podeEditarOuExcluir(maria, solicitacao('em_atendimento'))).toBe(false)
    expect(podeEditarOuExcluir(maria, solicitacao('concluido'))).toBe(false)
    expect(podeEditarOuExcluir(joao, solicitacao('aberto'))).toBe(false)
    expect(podeEditarOuExcluir(ana, solicitacao('aberto'))).toBe(false)
    expect(podeEditarOuExcluir(null, solicitacao('aberto'))).toBe(false)
  })

  it('só o atendente muda o status', () => {
    for (const status of ['aberto', 'em_atendimento', 'concluido'] as const) {
      expect(podeMudarStatus(ana, solicitacao(status))).toBe(true)
      expect(podeMudarStatus(maria, solicitacao(status))).toBe(false)
    }
    expect(podeMudarStatus(null, solicitacao('aberto'))).toBe(false)
  })
})

describe('validarSolicitacao', () => {
  const valido: ValoresFormulario = { titulo: 'Monitor com defeito', descricao: 'A tela pisca.', categoria: 'TI' }

  it('aceita dados válidos', () => {
    expect(validarSolicitacao(valido)).toEqual({})
  })

  it.each([
    ['título curto', { titulo: 'ab' }, 'titulo'],
    ['título só com espaços', { titulo: '    ' }, 'titulo'],
    ['título acima do limite', { titulo: 'x'.repeat(151) }, 'titulo'],
    ['descrição vazia', { descricao: '   ' }, 'descricao'],
    ['descrição acima do limite', { descricao: 'x'.repeat(5001) }, 'descricao'],
    ['categoria não escolhida', { categoria: '' as const }, 'categoria'],
  ])('recusa %s', (_nome, alteracao, campo) => {
    expect(Object.keys(validarSolicitacao({ ...valido, ...alteracao }))).toEqual([campo])
  })

  it('aponta todos os campos inválidos de uma vez', () => {
    expect(Object.keys(validarSolicitacao({ titulo: '', descricao: '', categoria: '' }))).toEqual(['titulo', 'descricao', 'categoria'])
  })

  it('aceita exatamente 3 e 150 caracteres no título', () => {
    expect(validarSolicitacao({ ...valido, titulo: 'abc' })).toEqual({})
    expect(validarSolicitacao({ ...valido, titulo: 'x'.repeat(150) })).toEqual({})
  })
})
