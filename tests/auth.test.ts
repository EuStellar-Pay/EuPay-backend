import { generateNonce, requireAuth } from '../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';

const VALID_ADDRESS = 'G' + 'A'.repeat(55);

function makeReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

function makeRes(): { res: Response; status: jest.Mock; json: jest.Mock } {
  const json   = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { res: { status, json } as unknown as Response, status, json };
}

describe('generateNonce', () => {
  it('returns a string starting with eupay:', () => {
    const nonce = generateNonce(VALID_ADDRESS);
    expect(typeof nonce).toBe('string');
    expect(nonce.startsWith('eupay:')).toBe(true);
  });

  it('embeds the address in the nonce', () => {
    const nonce = generateNonce(VALID_ADDRESS);
    expect(nonce).toContain(VALID_ADDRESS);
  });
});

describe('requireAuth', () => {
  const next: NextFunction = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('rejects when x-stellar-address header is missing', () => {
    const { res, status } = makeRes();
    requireAuth(makeReq({}), res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when x-stellar-signature header is missing', () => {
    const { res, status } = makeRes();
    requireAuth(makeReq({ 'x-stellar-address': VALID_ADDRESS }), res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when no active nonce exists for the address', () => {
    const unseeded = 'G' + 'B'.repeat(55); // no nonce generated for this address
    const { res, status } = makeRes();
    requireAuth(
      makeReq({ 'x-stellar-address': unseeded, 'x-stellar-signature': 'dummysig' }),
      res,
      next,
    );
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.stellarAddress when signature is valid', () => {
    // generateNonce seeds the store; mock verify returns true (see stellar-sdk mock)
    generateNonce(VALID_ADDRESS);
    const req = makeReq({ 'x-stellar-address': VALID_ADDRESS, 'x-stellar-signature': 'validbase64==' });
    const { res } = makeRes();
    requireAuth(req as any, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).stellarAddress).toBe(VALID_ADDRESS);
  });

  it('consumes the nonce so a second request with the same sig is rejected', () => {
    generateNonce(VALID_ADDRESS);
    const headers = { 'x-stellar-address': VALID_ADDRESS, 'x-stellar-signature': 'validbase64==' };
    const { res: res1 } = makeRes();
    requireAuth(makeReq(headers) as any, res1, next);
    jest.clearAllMocks();

    const { res: res2, status } = makeRes();
    requireAuth(makeReq(headers) as any, res2, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
