import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ employers: [] }));
router.get('/:address/treasury', (req, res) => res.json({ address: req.params.address, balance: '0', token: 'XLM' }));
export { router as employerRouter };
