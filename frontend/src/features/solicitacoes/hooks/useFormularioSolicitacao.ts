import { useState, type FormEvent } from 'react'
import { ApiError } from '@/services'
import type { SolicitacaoInput } from '@/types'
import { validarSolicitacao, type ErrosFormulario, type ValoresFormulario } from '../utils/validacao'

const VAZIO: ValoresFormulario = { titulo: '', descricao: '', categoria: '' }

// Estado, validação e envio do formulário de solicitação (usado para criar e para editar).
export function useFormularioSolicitacao(
  inicial: SolicitacaoInput | undefined,
  onSubmit: (dados: SolicitacaoInput) => Promise<void>,
) {
  const [valores, setValores] = useState<ValoresFormulario>(inicial ?? VAZIO)
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function alterar<K extends keyof ValoresFormulario>(campo: K, valor: ValoresFormulario[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
    setErros((atuais) => ({ ...atuais, [campo]: undefined })) // o erro some quando o usuário corrige
  }

  // Leva o foco ao primeiro campo com erro (na ordem da tela). Sem isto, quem usa teclado ou leitor de tela continua no botão
  // "Enviar" e não percebe onde está o problema. O `form` é capturado antes de qualquer `await` (depois dele o evento já não o tem).
  function focarPrimeiroComErro(form: HTMLFormElement, comErro: ErrosFormulario) {
    const primeiro = (['titulo', 'categoria', 'descricao'] as const).find((campo) => comErro[campo])
    if (primeiro) queueMicrotask(() => (form.elements.namedItem(primeiro) as HTMLElement | null)?.focus())
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const form = evento.currentTarget as HTMLFormElement
    const encontrados = validarSolicitacao(valores)
    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados)
      focarPrimeiroComErro(form, encontrados)
      return
    }

    setErroGeral(null)
    setEnviando(true)
    try {
      await onSubmit({
        titulo: valores.titulo.trim(),
        descricao: valores.descricao.trim(),
        categoria: valores.categoria as SolicitacaoInput['categoria'],
      })
    } catch (e) {
      if (e instanceof ApiError && e.detalhes?.length) {
        // A API também valida: mostra cada mensagem no campo correspondente.
        const doServidor: ErrosFormulario = Object.fromEntries(e.detalhes.map((d) => [d.campo, d.mensagem]))
        setErros(doServidor)
        focarPrimeiroComErro(form, doServidor)
      } else {
        setErroGeral(e instanceof ApiError ? e.message : 'Não foi possível salvar. Tente novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return { valores, erros, erroGeral, enviando, alterar, enviar }
}
