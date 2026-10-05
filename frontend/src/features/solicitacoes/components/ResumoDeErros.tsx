import { idDoCampo } from '../utils/idDoCampo'
import type { ErrosFormulario } from '../utils/validacao'

const ROTULOS: Record<keyof ErrosFormulario, string> = { titulo: 'Título', categoria: 'Categoria', descricao: 'Descrição' }
const ORDEM = ['titulo', 'categoria', 'descricao'] as const // a mesma ordem dos campos na tela

// Resumo no topo do formulário: anuncia (role="alert") quantos campos precisam de correção e lista cada erro com um link
// que leva ao campo. Leitores de tela ouvem o resumo assim que ele aparece; quem usa teclado pode ir direto ao problema.
export function ResumoDeErros({ erros }: { erros: ErrosFormulario }) {
  const itens = ORDEM.filter((campo) => erros[campo]).map((campo) => ({ campo, mensagem: erros[campo] as string }))
  if (itens.length === 0) return null

  return (
    <div role="alert" data-resumo-de-erros className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
      <p className="font-medium">Corrija {itens.length} {itens.length === 1 ? 'campo' : 'campos'} para continuar:</p>
      <ul className="mt-1 list-disc pl-5">
        {itens.map(({ campo, mensagem }) => (
          <li key={campo}>
            <a
              href={`#${idDoCampo(campo)}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(idDoCampo(campo))?.focus()
              }}
              className="inline-block min-h-6 py-0.5 underline" // alvo de toque de pelo menos 24 px (WCAG 2.2, critério 2.5.8)
            >
              {ROTULOS[campo]}: {mensagem}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
