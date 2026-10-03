import { Button, Input } from '@/components/ui'
import { useLoginForm } from '../hooks/useLoginForm'

export function LoginForm() {
  const { usuario, senha, erro, enviando, setUsuario, setSenha, enviar } = useLoginForm()

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Input
        label="Usuário"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        autoComplete="username"
        autoFocus
        required
      />
      <Input
        label="Senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete="current-password"
        required
      />

      {erro && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {erro}
        </p>
      )}

      <Button type="submit" loading={enviando} fullWidth size="lg">
        Entrar
      </Button>
    </form>
  )
}
