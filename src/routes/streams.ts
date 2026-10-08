import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import {
  getStream,
  getClaimableAmount,
  getRemainingFunds,
  getActiveSeconds,
} from '../services/contractClient';
import {
  buildCreateStreamXdr,
  buildCancelStreamXdr,
  buildPauseStreamXdr,
  buildResumeStreamXdr,
  buildFundStreamXdr,
} from '../services/txBuilder';

const router = Router();

const STELLAR_ADDRESS = /^G[A-Z0-9]{55}$/;

const CreateStreamSchema = z.object({
  workerAddress:   z.string().regex(STELLAR_ADDRESS, 'Invalid Stellar address'),
  tokenAddress:    z.string().regex(STELLAR_ADDRESS, 'Invalid token contract address'),
  ratePerSecond:   z.string().regex(/^\d+$/, 'Must be a positive integer string (stroops)'),
  durationSeconds: z.number().int().min(0),
  initialDeposit:  z.string().regex(/^\d+$/, 'Must be a positive integer string (stroops)'),
});

const FundSchema = z.object({
  amount: z.string().regex(/^\d+$/, 'Must be a positive integer string (stroops)'),
});

// GET /api/streams/:id — real contract read
router.get('/:id', async (req: Request, res: Response) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId) || streamId < 1) {
    res.status(400).json({ error: 'Invalid stream ID' });
    return;
  }
  try {
    const [stream, claimable, remaining, activeSeconds] = await Promise.all([
      getStream(streamId),
      getClaimableAmount(streamId),
      getRemainingFunds(streamId),
      getActiveSeconds(streamId),
    ]);
    res.json({ ...stream, claimableAmount: claimable, remainingFunds: remaining, activeSeconds });
  } catch (err: any) {
    if (err.message?.includes('NotFound') || err.message?.includes('not found')) {
      res.status(404).json({ error: 'Stream not found' });
    } else {
      res.status(502).json({ error: 'Contract call failed', detail: err.message });
    }
  }
});

// GET /api/streams/:id/claimable — quick claimable check
router.get('/:id/claimable', async (req: Request, res: Response) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId) || streamId < 1) {
    res.status(400).json({ error: 'Invalid stream ID' });
    return;
  }
  try {
    const amount = await getClaimableAmount(streamId);
    res.json({ streamId, claimableAmount: amount });
  } catch (err: any) {
    res.status(502).json({ error: 'Contract call failed', detail: err.message });
  }
});

// POST /api/streams — build unsigned create_stream XDR
router.post('/', requireAuth, writeLimiter, async (req: Request, res: Response) => {
  const parsed = CreateStreamSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    return;
  }
  const employerAddress = (req as any).stellarAddress as string;
  const { workerAddress, tokenAddress, ratePerSecond, durationSeconds, initialDeposit } = parsed.data;
  try {
    const xdr = await buildCreateStreamXdr(
      employerAddress, workerAddress, tokenAddress,
      ratePerSecond, durationSeconds, initialDeposit,
    );
    res.status(200).json({ xdr, description: 'Sign and submit this transaction to create the stream' });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to build transaction', detail: err.message });
  }
});

// DELETE /api/streams/:id — build unsigned cancel_stream XDR
router.delete('/:id', requireAuth, writeLimiter, async (req: Request, res: Response) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId) || streamId < 1) {
    res.status(400).json({ error: 'Invalid stream ID' });
    return;
  }
  const employerAddress = (req as any).stellarAddress as string;
  try {
    const xdr = await buildCancelStreamXdr(employerAddress, streamId);
    res.json({ xdr, description: 'Sign and submit this transaction to cancel the stream' });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to build transaction', detail: err.message });
  }
});

// POST /api/streams/:id/pause — build unsigned pause XDR
router.post('/:id/pause', requireAuth, writeLimiter, async (req: Request, res: Response) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId) || streamId < 1) {
    res.status(400).json({ error: 'Invalid stream ID' });
    return;
  }
  const employerAddress = (req as any).stellarAddress as string;
  try {
    const xdr = await buildPauseStreamXdr(employerAddress, streamId);
    res.json({ xdr, description: 'Sign and submit this transaction to pause the stream' });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to build transaction', detail: err.message });
  }
});

// POST /api/streams/:id/resume — build unsigned resume XDR
router.post('/:id/resume', requireAuth, writeLimiter, async (req: Request, res: Response) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId) || streamId < 1) {
    res.status(400).json({ error: 'Invalid stream ID' });
    return;
  }
  const employerAddress = (req as any).stellarAddress as string;
  try {
    const xdr = await buildResumeStreamXdr(employerAddress, streamId);
    res.json({ xdr, description: 'Sign and submit this transaction to resume the stream' });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to build transaction', detail: err.message });
  }
});

// POST /api/streams/:id/fund — build unsigned fund_stream XDR
router.post('/:id/fund', requireAuth, writeLimiter, async (req: Request, res: Response) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId) || streamId < 1) {
    res.status(400).json({ error: 'Invalid stream ID' });
    return;
  }
  const parsed = FundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    return;
  }
  const employerAddress = (req as any).stellarAddress as string;
  try {
    const xdr = await buildFundStreamXdr(employerAddress, streamId, parsed.data.amount);
    res.json({ xdr, description: 'Sign and submit this transaction to fund the stream' });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to build transaction', detail: err.message });
  }
});

export { router as streamRouter };
