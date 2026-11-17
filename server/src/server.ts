import { createApp } from './app';
import { config } from './config';
import { createContainer } from './container';
import { connectDatabase } from './infrastructure/db/connection';

async function main(): Promise<void> {
  await connectDatabase(config.mongoUri);
  const app = createApp(createContainer());
  app.listen(config.port, () => {
    console.info(`TinyTicket API escuchando en http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('No se pudo iniciar el servidor. ¿Esta corriendo MongoDB? (npm run db:up)');
  console.error(err);
  process.exit(1);
});
