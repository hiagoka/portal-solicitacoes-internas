import { Link, type LinkProps } from 'react-router'
import { botaoClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'

type LinkButtonProps = LinkProps & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

// Link de navegação com aparência de botão. Usa <a> de verdade (e não <button> dentro de <a>),
// que é o HTML correto e funciona com "abrir em nova aba" e leitores de tela.
export function LinkButton({ variant = 'primary', size = 'md', fullWidth = false, className, ...props }: LinkButtonProps) {
  return <Link className={botaoClasses(variant, size, fullWidth, className)} {...props} />
}
