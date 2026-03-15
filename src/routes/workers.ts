import { Router } from 'express';
const router = Router();
router.get('/:address/streams', (req, res) => res.json({ address: req.params.address, streams: [], totalEarned: '0' }));
router.post('/:address/claim', (req, res) => res.json({ address: req.params.address, claimed: '0', txHash: null }));
export { router as workerRouter };
