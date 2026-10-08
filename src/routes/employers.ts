import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { getTreasuryBalance, getStreamAllocation } from '../services/contractClient';
import { buildDepositXdr, buildAllocateXdr } from '../services/txBuilder';

const router = Router();

const STELLAR_ADDRESS = /^G[A-Z0-9]{55}$/;

const DepositSchema = z.object({
  tokenAddress: z.string().regex(STELLAR_ADDRESS, 'Invalid token contract address'),
  amount:       z.string().regex(/^\d+$/, 'Must be a positive integer string (stroops)'),
});

const AllocateSchema = z.object({
  streamId:     z.number().int().positive(),
  tokenAddress: z.string().regex(STELLAR_ADDRESS, 'Invalid token contract address'),
  amount:       z.string().regex(/^\d+$/, 'Must be a positive integer string (stroops)'),
});

// GET /api/employers/:address/treasury — real vault balance read
router.get('/:address/treasury', async (req: Request, res: Response) => {
  const { address } = req.params;
  const tokenAddress = req.query.token as string;

  if (!tokenAddress || !STELLAR_ADDRESS.test(tokenAddress)) {
    res.status(400).json({ error: 'Query param ?token=<Stellar address> is required' });
    return;
  }
  try {
    const balance = await getTreasuryBalance(tokenAddress);
    res.json({ address, tokenAddress, balance });
  } catch (err: any) {
    res.status(502).json({ error: 'Contract call failed', detail: err.message });
  }
});

// GET /api/employers/:address/treasury/allocation — stream allocation read
router.get('/:address/treasury/allocation', async (req: Request, res: Response) => {
  const streamId    = parseInt(req.query.streamId as string, 10);
  const tokenAddress = req.query.token as string;

  if (isNaN(streamId) || streamId < 1) {
    res.status(400).json({ error: 'Query param ?streamId=<number> is required' });
    return;
  }
  if (!tokenAddress || !STELLAR_ADDRESS.test(tokenAddress)) {
    res.status(400).json({ error: 'Query param ?token=<Stellar address> is required' });
    return;
  }
  try {
    const allocation = await getStreamAllocation(streamId, tokenAddress);
    res.json({ streamId, tokenAddress, allocation });
  } catch (err: any) {
    res.status(502).json({ error: 'Contract call failed', detail: err.message });
  }
});

// POST /api/employers/:address/treasury/deposit — build unsigned deposit XDR
router.post('/:address/treasury/deposit', requireAuth, async (req: Request, res: Response) => {
  const employerAddress = (req as any).stellarAddress as string;
  if (employerAddress !== req.params.address) {
    res.status(403).json({ error: 'Authenticated address does not match URL address' });
    return;
  }
  const parsed = DepositSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    return;
  }
  try {
    const xdr = await buildDepositXdr(employerAddress, parsed.data.tokenAddress, parsed.data.amount);
    res.json({ xdr, description: 'Sign and submit this transaction to deposit into the treasury vault' });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to build transaction', detail: err.message });
  }
});

// POST /api/employers/:address/treasury/allocate — build unsigned allocate XDR
router.post('/:address/treasury/allocate', requireAuth, async (req: Request, res: Response) => {
  const employerAddress = (req as any).stellarAddress as string;
  if (employerAddress !== req.params.address) {
    res.status(403).json({ error: 'Authenticated address does not match URL address' });
    return;
  }
  const parsed = AllocateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    return;
  }
  try {
    const xdr = await buildAllocateXdr(
      employerAddress,
      parsed.data.streamId,
      parsed.data.tokenAddress,
      parsed.data.amount,
    );
    res.json({ xdr, description: 'Sign and submit this transaction to allocate vault funds to a stream' });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to build transaction', detail: err.message });
  }
});

export { router as employerRouter };
