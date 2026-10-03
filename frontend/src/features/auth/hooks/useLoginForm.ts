import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks'
import { ApiError } from '@/services'
import { useDestinoPosLogin } from './useDestinoPosLogin'

// Estado e envio do formulário de login. O componente só desenha; as regras ficam aqui.
export function useLoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const destino = useDestinoPosLogin()

  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!usuario.trim() || !senha) {
      setErro('Informe o usuário e a senha.')
      return
    }

    setErro(null)
    setEnviando(true)
    try {
      await login(usuario.trim(), senha)
      navigate(destino, { replace: true })
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.')
      setEnviando(false)
    }
  }

  return { usuario, senha, erro, enviando, setUsuario, setSenha, enviar }
}
