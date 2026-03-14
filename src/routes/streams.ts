import { Router } from 'express';
import { z } from 'zod';
const router = Router();
const CreateStreamSchema = z.object({ workerAddress: z.string().min(56).max(56), ratePerSecond: z.string(), durationSeconds: z.number().int().positive() });
router.get('/', (_req, res) => res.json({ streams: [], total: 0, page: 1 }));
router.post('/', (req, res) => {
  const parsed = CreateStreamSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  res.status(201).json({ streamId: `STR-${Date.now()}`, status: 'pending', ...parsed.data });
});
router.get('/:id', (req, res) => res.json({ id: req.params.id, status: 'active', ratePerSecond: '1000000', totalClaimed: '0' }));
router.delete('/:id', (req, res) => res.json({ id: req.params.id, status: 'cancelled' }));
export { router as streamRouter };
