import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.detail ? { detail: err.detail } : {}),
    });
    return;
  }

  // Soroban contract errors come back as plain Error with a descriptive message
  if (err.message?.includes('Contract error') || err.message?.includes('Simulation error')) {
    res.status(502).json({ error: 'Contract call failed', detail: err.message });
    return;
  }

  // Zod parse errors leaked through (shouldn't happen but guard anyway)
  if (err.name === 'ZodError') {
    res.status(400).json({ error: 'Validation failed', detail: err.message });
    return;
  }

  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
}
