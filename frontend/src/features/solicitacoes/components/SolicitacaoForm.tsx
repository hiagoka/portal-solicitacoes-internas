import { Button, Card, Input, Select, Textarea } from '@/components/ui'
import { CATEGORIAS_LISTA, CATEGORIA_LABEL } from '@/constants'
import type { Categoria, SolicitacaoInput } from '@/types'
import { useFormularioSolicitacao } from '../hooks'
import { LIMITE_DESCRICAO, LIMITE_TITULO } from '../utils/validacao'

type SolicitacaoFormProps = {
  /** Valores iniciais (edição). Sem eles, o formulário começa vazio (criação). */
  inicial?: SolicitacaoInput
  textoEnviar: string
  onSubmit: (dados: SolicitacaoInput) => Promise<void>
  onCancelar: () => void
}

const OPCOES_CATEGORIA = CATEGORIAS_LISTA.map((c) => ({ value: c, label: CATEGORIA_LABEL[c] }))

export function SolicitacaoForm({ inicial, textoEnviar, onSubmit, onCancelar }: SolicitacaoFormProps) {
  const { valores, erros, erroGeral, enviando, alterar, enviar } = useFormularioSolicitacao(inicial, onSubmit)

  return (
    <Card padding="lg">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <Input
          label="Título"
          value={valores.titulo}
          onChange={(e) => alterar('titulo', e.target.value)}
          error={erros.titulo}
          maxLength={LIMITE_TITULO}
          autoFocus
          required
        />
        <Select
          label="Categoria"
          placeholder="Selecione..."
          options={OPCOES_CATEGORIA}
          value={valores.categoria}
          onChange={(e) => alterar('categoria', e.target.value as Categoria | '')}
          error={erros.categoria}
          required
        />
        <Textarea
          label="Descrição"
          rows={6}
          value={valores.descricao}
          onChange={(e) => alterar('descricao', e.target.value)}
          error={erros.descricao}
          hint={`${valores.descricao.length}/${LIMITE_DESCRICAO} caracteres`}
          maxLength={LIMITE_DESCRICAO}
          required
        />

        {erroGeral && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {erroGeral}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancelar} disabled={enviando} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" loading={enviando} className="w-full sm:w-auto">
            {textoEnviar}
          </Button>
        </div>
      </form>
    </Card>
  )
}
