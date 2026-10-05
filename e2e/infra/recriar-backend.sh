#!/usr/bin/env bash
# Prova que o nginx acompanha a RECRIAÇÃO do backend (que ganha outro IP) sem precisar ser reiniciado.
#
# Cenário real: `docker compose up -d --build backend` (ou um deploy) recria o contêiner da API. Se o nginx resolveu o nome
# "backend" só uma vez, na partida, continua enviando as requisições ao IP antigo e responde 502 até ser recarregado.
#
# Uso (com o sistema no ar):   FRONTEND_URL=http://localhost:8080 bash e2e/infra/recriar-backend.sh
# Variáveis: FRONTEND_URL (padrão http://localhost:8080) e COMPOSE (padrão "docker compose").
set -euo pipefail
cd "$(dirname "$0")/../.."
URL="${FRONTEND_URL:-http://localhost:8080}"
COMPOSE="${COMPOSE:-docker compose}"

http() { curl -s -m 5 -o /dev/null -w '%{http_code}' "$URL/api/health" || true; }
rede() { docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' "$($COMPOSE ps -q backend)"; }
ip()   { docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$($COMPOSE ps -q backend)"; }

echo "antes: /api/health = $(http) (backend em $(ip))"
[ "$(http)" = 200 ] || { echo "✗ o sistema não está respondendo antes do teste"; exit 1; }

REDE="$(rede)"; IP_ANTIGO="$(ip)"
trap 'docker ps -aq --filter "name=ocupa-ip-do-backend" | xargs -r docker rm -f >/dev/null 2>&1 || true' EXIT

# Recria o backend até ele receber OUTRO IP. O Docker costuma (mas nem sempre) dar um endereço novo; contêineres "tampão"
# ocupam os endereços livres para empurrar o backend para um diferente. Sem IP novo o teste não provaria nada.
IP_NOVO="$IP_ANTIGO"
for tentativa in 1 2 3 4 5 6; do
  $COMPOSE rm -sf backend >/dev/null 2>&1
  docker run -d --rm --name "ocupa-ip-do-backend-$tentativa" --network "$REDE" alpine sleep 600 >/dev/null
  $COMPOSE up -d --no-deps backend >/dev/null 2>&1
  for _ in $(seq 1 60); do
    [ "$(docker inspect -f '{{.State.Health.Status}}' "$($COMPOSE ps -q backend)" 2>/dev/null)" = healthy ] && break
    sleep 1
  done
  IP_NOVO="$(ip)"
  [ "$IP_NOVO" != "$IP_ANTIGO" ] && break
done
echo "backend recriado: $IP_ANTIGO → $IP_NOVO"
[ "$IP_ANTIGO" != "$IP_NOVO" ] || { echo "✗ o backend continuou com o mesmo IP: o teste não provaria nada"; exit 1; }

# O nginx pode levar alguns segundos para resolver o nome de novo (o cache de DNS dele é curto, não zero).
for i in $(seq 1 30); do
  [ "$(http)" = 200 ] && { echo "✓ o nginx passou a usar o novo backend sozinho (após ${i}s), sem reinício"; exit 0; }
  sleep 1
done
echo "✗ /api/health continua respondendo $(http) 30 s depois: o nginx guardou o IP antigo"
exit 1
