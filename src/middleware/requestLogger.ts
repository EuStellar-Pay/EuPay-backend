import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const ms      = Date.now() - start;
    const status  = res.statusCode;
    const address = (req as any).stellarAddress ?? '-';
    const level   = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
    console.log(
      JSON.stringify({ level, ts: new Date().toISOString(), method, url, status, ms, address }),
    );
  });

  next();
}
