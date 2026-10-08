import { Router, Request, Response } from 'express';
import { getStreamEvents, getWorkerEvents } from '../services/eventIndexer';

const router = Router();

const STELLAR_ADDRESS = /^G[A-Z0-9]{55}$/;

function parseOpts(query: Record<string, unknown>) {
  const limit       = query.limit       ? parseInt(query.limit as string, 10)       : 50;
  const cursor      = typeof query.cursor === 'string' ? query.cursor : undefined;
  const startLedger = query.startLedger ? parseInt(query.startLedger as string, 10) : undefined;
  return { limit: isNaN(limit) ? 50 : Math.min(limit, 200), cursor, startLedger };
}

// GET /api/streams/:id/events — all contract events for a given stream ID
router.get('/streams/:id/events', async (req: Request, res: Response) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId) || streamId < 1) {
    res.status(400).json({ error: 'Invalid stream ID' });
    return;
  }
  try {
    const { events, cursor } = await getStreamEvents(streamId, parseOpts(req.query as any));
    res.json({ streamId, count: events.length, nextCursor: cursor, events });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to fetch events', detail: err.message });
  }
});

// GET /api/workers/:address/events — all contract events involving a worker address
router.get('/workers/:address/events', async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!STELLAR_ADDRESS.test(address)) {
    res.status(400).json({ error: 'Invalid Stellar address' });
    return;
  }
  try {
    const { events, cursor } = await getWorkerEvents(address, parseOpts(req.query as any));
    res.json({ address, count: events.length, nextCursor: cursor, events });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to fetch events', detail: err.message });
  }
});

export { router as eventRouter };
