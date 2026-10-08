/**
 * Route input validation tests — verifies that bad input is rejected with 400
 * before it reaches any contract call. Contract calls are not mocked here;
 * instead we rely on the fact that validation runs before async logic.
 */
import express from 'express';
import request from 'supertest';

// Build a minimal app with just the stream and employer routers
// so we don't need a running Soroban RPC
import { authRouter }     from '../src/routes/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

const VALID_ADDRESS = 'G' + 'A'.repeat(55);

describe('GET /api/auth/nonce/:address — input validation', () => {
  it('returns 400 for a non-Stellar address', async () => {
    const res = await request(app).get('/api/auth/nonce/not-a-stellar-address');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for a short address', async () => {
    const res = await request(app).get('/api/auth/nonce/GABC');
    expect(res.status).toBe(400);
  });

  it('returns 200 and a nonce for a valid address', async () => {
    const res = await request(app).get(`/api/auth/nonce/${VALID_ADDRESS}`);
    expect(res.status).toBe(200);
    expect(res.body.nonce).toBeDefined();
    expect(res.body.nonce).toContain('eupay:');
    expect(res.body.expiresInSeconds).toBe(300);
  });
});
