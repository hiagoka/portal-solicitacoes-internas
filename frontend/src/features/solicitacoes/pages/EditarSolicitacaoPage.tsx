import { useNavigate } from 'react-router'
import { EmptyState, LinkButton } from '@/components/ui'
import { ROTAS } from '@/constants'
import { useAuth } from '@/hooks'
import { EstadoDaBusca } from '../components/EstadoDaBusca'
import { SolicitacaoForm } from '../components/SolicitacaoForm'
import { useEditarSolicitacao, useIdDaRota, useSolicitacao } from '../hooks'
import { podeEditarOuExcluir } from '../utils/permissoes'

export function EditarSolicitacaoPage() {
  const id = useIdDaRota()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { solicitacao, carregando, erro, naoEncontrada, recarregar } = useSolicitacao(id)
  const editar = useEditarSolicitacao(id)
  const voltar = () => navigate(ROTAS.detalhesSolicitacao(id))

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Editar solicitação</h1>
      <EstadoDaBusca
        carregando={carregando}
        naoEncontrada={naoEncontrada || Number.isNaN(id)}
        erro={erro}
        onTentarNovamente={recarregar}
      >
        {solicitacao && podeEditarOuExcluir(usuario, solicitacao) ? (
          <SolicitacaoForm
            inicial={{ titulo: solicitacao.titulo, descricao: solicitacao.descricao, categoria: solicitacao.categoria }}
            textoEnviar="Salvar alterações"
            onSubmit={editar}
            onCancelar={voltar}
          />
        ) : (
          <EmptyState
            title="Esta solicitação não pode ser editada"
            description="Só o autor pode editar, e apenas enquanto ela estiver aberta."
            action={<LinkButton to={ROTAS.detalhesSolicitacao(id)} variant="secondary">Ver detalhes</LinkButton>}
          />
        )}
      </EstadoDaBusca>
    </div>
  )
}
