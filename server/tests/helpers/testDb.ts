import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let server: MongoMemoryServer | undefined;

/** Starts an in-memory MongoDB for the test file (no Docker needed for tests). */
export async function startTestDb(): Promise<void> {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri());
  // Make sure unique indexes (ticket code, user email) exist before the tests run.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

export async function clearTestDb(): Promise<void> {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function stopTestDb(): Promise<void> {
  await mongoose.disconnect();
  await server?.stop();
}
