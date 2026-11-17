import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { createContainer } from '../../src/container';
import { seedDatabase } from '../../src/seed/seedDatabase';
import { startTestDb, stopTestDb } from '../helpers/testDb';

describe('REST API (smoke test over the seeded data)', () => {
  const c = createContainer();
  const app = createApp(c);
  let freeEventId = '';

  beforeAll(async () => {
    await startTestDb();
    const { events } = await seedDatabase(c);
    freeEventId = events.find((e) => e.isFree())!.id;
  });
  afterAll(stopTestDb);

  it('lists preloaded users for the mock login', async () => {
    const res = await request(app).get('/api/auth/users').expect(200);
    expect(res.body.map((u: { role: string }) => u.role)).toEqual(
      expect.arrayContaining(['ORGANIZER', 'ATTENDEE', 'ADMIN']),
    );
  });

  it('lists public events', async () => {
    const res = await request(app).get('/api/events').expect(200);
    expect(res.body.length).toBe(4);
    expect(res.body[0]).toHaveProperty('availableSeats');
  });

  it('full flow: reserve -> my tickets -> door check twice', async () => {
    const reserve = await request(app)
      .post(`/api/events/${freeEventId}/reservations`)
      .set('X-User-Id', 'att-tomas')
      .send({ quantity: 1 })
      .expect(201);
    const code = reserve.body.tickets[0].code;
    expect(reserve.body.tickets[0].qrDataUrl).toMatch(/^data:image\/png;base64,/);

    const mine = await request(app).get('/api/me/tickets').set('X-User-Id', 'att-tomas').expect(200);
    expect(mine.body.some((t: { code: string }) => t.code === code)).toBe(true);

    await request(app).post(`/api/tickets/${code}/validate`).set('X-User-Id', 'org-lucia').expect(200);
    await request(app).post(`/api/tickets/${code}/validate`).set('X-User-Id', 'org-lucia').expect(409);
  });

  it('enforces roles', async () => {
    await request(app).post('/api/events').send({}).expect(401);
    await request(app).post('/api/events').set('X-User-Id', 'att-sofia').send({}).expect(403);
    await request(app).get('/api/organizer/dashboard').set('X-User-Id', 'att-sofia').expect(403);
  });

  it('organizer dashboard shows sales from the seed', async () => {
    const res = await request(app).get('/api/organizer/dashboard').set('X-User-Id', 'org-martin').expect(200);
    expect(res.body.totals.ticketsIssued).toBeGreaterThanOrEqual(2);
    expect(res.body.totals.revenue).toBe(13000);
  });

  it('admin removes an event and it leaves the catalogue', async () => {
    await request(app)
      .patch(`/api/admin/events/${freeEventId}/remove`)
      .set('X-User-Id', 'adm-root')
      .send({ reason: 'Prueba' })
      .expect(200);
    const res = await request(app).get('/api/events').expect(200);
    expect(res.body.some((e: { id: string }) => e.id === freeEventId)).toBe(false);
  });
});
