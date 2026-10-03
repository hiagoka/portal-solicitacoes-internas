#!/usr/bin/env bash
# Roda todas as suítes E2E em sequência contra uma instância já no ar, restaurando o banco entre elas.
#
# Variáveis (todas opcionais; os padrões servem ao docker compose local):
#   APP_URL      endereço do frontend           (padrão do compose: http://localhost:8080)
#   API_URL      endereço da API visto pelo navegador (padrão do compose: http://localhost:8080/api)
#   CHROME_PATH  caminho do Chrome/Chromium
#   DB_EXEC      comando que abre o psql do banco (recebe SQL pela entrada padrão)
#   SUITES       lista de suítes separadas por espaço (padrão: todas)
set -euo pipefail
cd "$(dirname "$0")"
RAIZ="$(cd .. && pwd)"

export APP_URL="${APP_URL:-http://localhost:8080}"
export API_URL="${API_URL:-http://localhost:8080/api}"
DB_EXEC="${DB_EXEC:-docker compose -f $RAIZ/docker-compose.yml exec -T db psql -q -v ON_ERROR_STOP=1 -U portal -d portal}"
SUITES="${SUITES:-auth lista crud dashboard acessibilidade responsivo}"

restaurar_banco() {
  # Mesmos scripts que inicializam o sistema: o teste parte sempre do estado de demonstração.
  cat "$RAIZ/database/schema.sql" "$RAIZ/database/seed.sql" | $DB_EXEC >/dev/null
  # Usuário sem nenhuma solicitação, usado pelo teste do dashboard vazio (reaproveita o hash da Maria: senha123).
  echo "INSERT INTO usuarios (nome, usuario, senha_hash, perfil)
        SELECT 'Sem Solicitações', 'vazio', senha_hash, 'solicitante' FROM usuarios WHERE usuario = 'maria';" | $DB_EXEC >/dev/null
}

[ -d node_modules ] || npm ci --silent

falhas=0
for suite in $SUITES; do
  echo "=== $suite"
  restaurar_banco
  node "tests/$suite.e2e.mjs" || falhas=$((falhas + 1))
done

restaurar_banco   # deixa o banco limpo para quem vier depois
if [ "$falhas" -gt 0 ]; then echo "✗ $falhas suíte(s) com falha"; exit 1; fi
echo "✓ todas as suítes passaram"
