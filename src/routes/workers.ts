import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import { getStream, getClaimableAmount } from '../services/contractClient';
import { buildClaimXdr } from '../services/txBuilder';

const router = Router();

const ClaimSchema = z.object({
  streamId: z.number().int().positive(),
});

// GET /api/workers/:address/streams/:id — get a specific stream for a worker
router.get('/:address/streams/:id', async (req: Request, res: Response) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId) || streamId < 1) {
    res.status(400).json({ error: 'Invalid stream ID' });
    return;
  }
  try {
    const [stream, claimable] = await Promise.all([
      getStream(streamId),
      getClaimableAmount(streamId),
    ]);
    if (stream.worker !== req.params.address) {
      res.status(403).json({ error: 'Stream does not belong to this worker' });
      return;
    }
    res.json({ ...stream, claimableAmount: claimable });
  } catch (err: any) {
    res.status(502).json({ error: 'Contract call failed', detail: err.message });
  }
});

// POST /api/workers/:address/claim — build unsigned claim XDR
router.post('/:address/claim', requireAuth, writeLimiter, async (req: Request, res: Response) => {
  const workerAddress = (req as any).stellarAddress as string;
  if (workerAddress !== req.params.address) {
    res.status(403).json({ error: 'Authenticated address does not match URL address' });
    return;
  }
  const parsed = ClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    return;
  }
  const { streamId } = parsed.data;
  try {
    // Verify the stream belongs to this worker and has something to claim
    const [stream, claimable] = await Promise.all([
      getStream(streamId),
      getClaimableAmount(streamId),
    ]);
    if (stream.worker !== workerAddress) {
      res.status(403).json({ error: 'Stream does not belong to this worker' });
      return;
    }
    if (claimable === '0') {
      res.status(400).json({ error: 'Nothing to claim on this stream' });
      return;
    }
    const xdr = await buildClaimXdr(workerAddress, streamId);
    res.json({ xdr, claimableAmount: claimable, description: 'Sign and submit this transaction to claim your earnings' });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to build transaction', detail: err.message });
  }
});

export { router as workerRouter };
