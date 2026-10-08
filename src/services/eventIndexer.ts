import {
  rpc as SorobanRpc,
  xdr,
  scValToNative,
} from '@stellar/stellar-sdk';

const RPC_URL  = process.env.STELLAR_RPC_URL  ?? 'https://soroban-testnet.stellar.org';
const NETWORK  = process.env.STELLAR_NETWORK  ?? 'testnet';
const CONTRACT = process.env.CONTRACT_PAYROLL_STREAM ?? '';

const server = new SorobanRpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith('http://') });

export interface StreamEvent {
  id:          string;
  txHash:      string;
  ledger:      number;
  closedAt:    string;
  type:        string;
  streamId:    number | null;
  workerAddress: string | null;
  payload:     unknown;
}

function decodeEvent(raw: SorobanRpc.Api.EventResponse): StreamEvent {
  const topics = raw.topic.map((t: xdr.ScVal) => {
    try { return scValToNative(t); } catch { return t.toXDR('base64'); }
  });

  const type        = typeof topics[0] === 'string' ? topics[0] : 'unknown';
  const streamId    = typeof topics[1] === 'number' ? topics[1] : null;
  const workerAddress = typeof topics[2] === 'string' ? topics[2] : null;

  let payload: unknown = null;
  try { payload = scValToNative(raw.value); } catch { payload = raw.value.toXDR('base64'); }

  return {
    id:          raw.id,
    txHash:      raw.txHash,
    ledger:      raw.ledger,
    closedAt:    raw.ledgerClosedAt,
    type,
    streamId,
    workerAddress,
    payload,
  };
}

interface FetchOptions {
  startLedger?: number;
  cursor?:      string;
  limit?:       number;
}

async function fetchContractEvents(opts: FetchOptions = {}): Promise<{
  events: StreamEvent[];
  cursor: string | null;
}> {
  const limit = Math.min(opts.limit ?? 50, 200);

  const request: SorobanRpc.Server.GetEventsRequest = {
    filters: [{
      type:        'contract',
      contractIds: [CONTRACT],
    }],
    pagination: { limit, ...(opts.cursor ? { cursor: opts.cursor } : {}) },
    ...(opts.startLedger !== undefined ? { startLedger: opts.startLedger } : {}),
  };

  const response = await server.getEvents(request);
  const events   = response.events.map(decodeEvent);
  const lastId   = events.length > 0 ? events[events.length - 1].id : null;

  return { events, cursor: lastId };
}

export async function getStreamEvents(
  streamId: number,
  opts: FetchOptions = {},
): Promise<{ events: StreamEvent[]; cursor: string | null }> {
  const { events, cursor } = await fetchContractEvents(opts);
  return {
    events: events.filter(e => e.streamId === streamId),
    cursor,
  };
}

export async function getWorkerEvents(
  workerAddress: string,
  opts: FetchOptions = {},
): Promise<{ events: StreamEvent[]; cursor: string | null }> {
  const { events, cursor } = await fetchContractEvents(opts);
  return {
    events: events.filter(e => e.workerAddress === workerAddress),
    cursor,
  };
}
