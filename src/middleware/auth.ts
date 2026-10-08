import { Request, Response, NextFunction } from 'express';
import { Keypair } from '@stellar/stellar-sdk';

// In-memory nonce store (replace with Redis in production)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

export function generateNonce(address: string): string {
  const nonce = `eupay:${address}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  nonceStore.set(address, { nonce, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min TTL
  return nonce;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const address   = req.headers['x-stellar-address'] as string;
  const signature = req.headers['x-stellar-signature'] as string;

  if (!address || !signature) {
    res.status(401).json({ error: 'Missing x-stellar-address or x-stellar-signature header' });
    return;
  }

  const entry = nonceStore.get(address);
  if (!entry || Date.now() > entry.expiresAt) {
    res.status(401).json({ error: 'No active nonce for address — request one via GET /api/auth/nonce/:address' });
    return;
  }

  try {
    const keypair = Keypair.fromPublicKey(address);
    const valid   = keypair.verify(Buffer.from(entry.nonce), Buffer.from(signature, 'base64'));
    if (!valid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
    // Consume the nonce so it can't be replayed
    nonceStore.delete(address);
    (req as any).stellarAddress = address;
    next();
  } catch {
    res.status(401).json({ error: 'Signature verification failed' });
  }
}
