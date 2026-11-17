import { config } from '../config';
import { createContainer } from '../container';
import { connectDatabase, disconnectDatabase } from '../infrastructure/db/connection';
import { SEED_USERS, seedDatabase } from './seedDatabase';

async function main(): Promise<void> {
  await connectDatabase(config.mongoUri);
  const { events } = await seedDatabase(createContainer());
  const users = [...SEED_USERS.organizers, ...SEED_USERS.attendees, ...SEED_USERS.admins];
  console.info(`Base cargada: ${users.length} usuarios, ${events.length} eventos.`);
  console.table(users.map((u) => ({ id: u.id, nombre: u.name, rol: u.role })));
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('Fallo el seed. ¿Esta corriendo MongoDB? (npm run db:up)');
  console.error(err);
  await disconnectDatabase();
  process.exit(1);
});
