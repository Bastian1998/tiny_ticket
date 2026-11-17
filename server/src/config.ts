import 'dotenv/config';

export const config = {
  // API_PORT (not PORT) so it never collides with the Vite dev server or a global PORT variable.
  port: Number(process.env.API_PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/tinyticket',
};
