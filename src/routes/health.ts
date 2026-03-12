import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ status: 'ok', service: 'eupay-backend', version: '0.1.0', timestamp: new Date().toISOString() }));
export { router as healthRouter };
