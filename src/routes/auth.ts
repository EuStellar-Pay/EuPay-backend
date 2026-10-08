import { Router, Request, Response } from 'express';
import { generateNonce } from '../middleware/auth';

const router = Router();

const STELLAR_ADDRESS = /^G[A-Z0-9]{55}$/;

// GET /api/auth/nonce/:address — get a challenge nonce to sign
router.get('/nonce/:address', (req: Request, res: Response) => {
  const { address } = req.params;
  if (!STELLAR_ADDRESS.test(address)) {
    res.status(400).json({ error: 'Invalid Stellar address' });
    return;
  }
  const nonce = generateNonce(address);
  res.json({ address, nonce, expiresInSeconds: 300 });
});

export { router as authRouter };
