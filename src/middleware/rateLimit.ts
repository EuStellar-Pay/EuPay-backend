import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count:     number;
  resetAt:   number;
}

const store = new Map<string, Bucket>();

function makeRateLimiter(maxRequests: number, windowMs: number) {
  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    // Prefer authenticated Stellar address; fall back to IP
    const key = (req as any).stellarAddress
      ?? req.headers['x-forwarded-for']?.toString().split(',')[0].trim()
      ?? req.socket.remoteAddress
      ?? 'unknown';

    const now    = Date.now();
    const bucket = store.get(key);

    if (!bucket || now > bucket.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= maxRequests) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many requests',
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    bucket.count += 1;
    next();
  };
}

// 60 req / 60 s for general API traffic
export const apiLimiter = makeRateLimiter(60, 60_000);

// 5 nonce requests / 60 s — prevents nonce-spam
export const nonceLimiter = makeRateLimiter(5, 60_000);

// 10 write XDR builds / 60 s per address — contract simulation is expensive
export const writeLimiter = makeRateLimiter(10, 60_000);
