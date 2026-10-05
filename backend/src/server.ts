import { app } from './app';
import { env } from './config/env';
import { pool } from './config/database';

const servidor = app.listen(env.PORT, () => {
  console.log(`API rodando em http://localhost:${env.PORT}`);
});

// Encerramento limpo: para de aceitar requisições e fecha as conexões com o banco.
// - Conexões "keep-alive" ociosas são fechadas na hora; sem isso o close() esperaria cada uma expirar.
// - Há um tempo limite: se algo travar, o processo sai mesmo assim (o orquestrador mataria de qualquer forma).
// - Um segundo sinal durante o encerramento é ignorado.
const TEMPO_LIMITE_MS = 10_000;
let encerrando = false;

function encerrar() {
  if (encerrando) return;
  encerrando = true;

  setTimeout(() => {
    console.error(`Encerramento forçado: demorou mais de ${TEMPO_LIMITE_MS / 1000}s`);
    process.exit(1);
  }, TEMPO_LIMITE_MS).unref();

  servidor.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch (erro) {
      console.error('Falha ao fechar as conexões com o banco:', erro);
      process.exit(1);
    }
  });
  servidor.closeIdleConnections();
}
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
