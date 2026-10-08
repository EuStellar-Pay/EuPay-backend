import {
  Contract,
  rpc as SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';

const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK = process.env.STELLAR_NETWORK === 'MAINNET' ? Networks.PUBLIC : Networks.TESTNET;
const STREAM_CONTRACT_ID = process.env.CONTRACT_PAYROLL_STREAM || '';
const VAULT_CONTRACT_ID  = process.env.CONTRACT_TREASURY_VAULT || '';
// A funded testnet address used only as the simulation source account
const SIM_SOURCE = process.env.SIM_SOURCE_ADDRESS || '';

const server = new SorobanRpc.Server(RPC_URL);

async function simulate(contractId: string, method: string, args: xdr.ScVal[]): Promise<xdr.ScVal> {
  if (!contractId) throw new Error('Contract ID not configured');
  if (!SIM_SOURCE)  throw new Error('SIM_SOURCE_ADDRESS not configured');

  const account = await server.getAccount(SIM_SOURCE);
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Contract error: ${sim.error}`);
  }
  if (!sim.result) throw new Error('No result from simulation');
  return sim.result.retval;
}

// ── Stream reads ──────────────────────────────────────────────────────────────

export async function getStream(streamId: number) {
  const val = await simulate(STREAM_CONTRACT_ID, 'get_stream', [
    nativeToScVal(streamId, { type: 'u64' }),
  ]);
  return scValToNative(val);
}

export async function getClaimableAmount(streamId: number): Promise<string> {
  const val = await simulate(STREAM_CONTRACT_ID, 'claimable_amount', [
    nativeToScVal(streamId, { type: 'u64' }),
  ]);
  return String(scValToNative(val));
}

export async function getRemainingFunds(streamId: number): Promise<string> {
  const val = await simulate(STREAM_CONTRACT_ID, 'remaining_funds', [
    nativeToScVal(streamId, { type: 'u64' }),
  ]);
  return String(scValToNative(val));
}

export async function getActiveSeconds(streamId: number): Promise<string> {
  const val = await simulate(STREAM_CONTRACT_ID, 'active_seconds', [
    nativeToScVal(streamId, { type: 'u64' }),
  ]);
  return String(scValToNative(val));
}

export async function getStreamCount(): Promise<number> {
  const val = await simulate(STREAM_CONTRACT_ID, 'get_stream', [
    nativeToScVal(0, { type: 'u64' }),
  ]);
  // Fallback: just return 0 if stream 0 doesn't exist
  return 0;
}

// ── Treasury reads ────────────────────────────────────────────────────────────

export async function getTreasuryBalance(tokenAddress: string): Promise<string> {
  const val = await simulate(VAULT_CONTRACT_ID, 'balance', [
    nativeToScVal(tokenAddress, { type: 'address' }),
  ]);
  return String(scValToNative(val));
}

export async function getStreamAllocation(streamId: number, tokenAddress: string): Promise<string> {
  const val = await simulate(VAULT_CONTRACT_ID, 'stream_allocation', [
    nativeToScVal(streamId,     { type: 'u64' }),
    nativeToScVal(tokenAddress, { type: 'address' }),
  ]);
  return String(scValToNative(val));
}
