import {
  Contract,
  rpc as SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  xdr,
} from '@stellar/stellar-sdk';

const RPC_URL  = process.env.STELLAR_RPC_URL  || 'https://soroban-testnet.stellar.org';
const NETWORK  = process.env.STELLAR_NETWORK === 'MAINNET' ? Networks.PUBLIC : Networks.TESTNET;
const STREAM_CONTRACT_ID = process.env.CONTRACT_PAYROLL_STREAM || '';
const VAULT_CONTRACT_ID  = process.env.CONTRACT_TREASURY_VAULT || '';

const server = new SorobanRpc.Server(RPC_URL);

async function buildXdr(
  contractId: string,
  sourceAddress: string,
  method: string,
  args: xdr.ScVal[],
): Promise<string> {
  if (!contractId) throw new Error('Contract ID not configured');

  const account  = await server.getAccount(sourceAddress);
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get the footprint / auth entries so the frontend can sign correctly
  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation error: ${sim.error}`);
  }

  return SorobanRpc.assembleTransaction(tx, sim).build().toXDR();
}

// ── Stream write XDRs ─────────────────────────────────────────────────────────

export async function buildCreateStreamXdr(
  employerAddress: string,
  workerAddress:   string,
  tokenAddress:    string,
  ratePerSecond:   string,
  durationSeconds: number,
  initialDeposit:  string,
): Promise<string> {
  return buildXdr(STREAM_CONTRACT_ID, employerAddress, 'create_stream', [
    nativeToScVal(employerAddress, { type: 'address' }),
    nativeToScVal(workerAddress,   { type: 'address' }),
    nativeToScVal(tokenAddress,    { type: 'address' }),
    nativeToScVal(BigInt(ratePerSecond), { type: 'i128' }),
    nativeToScVal(durationSeconds,      { type: 'u64'  }),
    nativeToScVal(BigInt(initialDeposit), { type: 'i128' }),
  ]);
}

export async function buildClaimXdr(workerAddress: string, streamId: number): Promise<string> {
  return buildXdr(STREAM_CONTRACT_ID, workerAddress, 'claim', [
    nativeToScVal(workerAddress, { type: 'address' }),
    nativeToScVal(streamId,      { type: 'u64'     }),
  ]);
}

export async function buildCancelStreamXdr(employerAddress: string, streamId: number): Promise<string> {
  return buildXdr(STREAM_CONTRACT_ID, employerAddress, 'cancel_stream', [
    nativeToScVal(employerAddress, { type: 'address' }),
    nativeToScVal(streamId,        { type: 'u64'     }),
  ]);
}

export async function buildPauseStreamXdr(employerAddress: string, streamId: number): Promise<string> {
  return buildXdr(STREAM_CONTRACT_ID, employerAddress, 'pause_stream', [
    nativeToScVal(employerAddress, { type: 'address' }),
    nativeToScVal(streamId,        { type: 'u64'     }),
  ]);
}

export async function buildResumeStreamXdr(employerAddress: string, streamId: number): Promise<string> {
  return buildXdr(STREAM_CONTRACT_ID, employerAddress, 'resume_stream', [
    nativeToScVal(employerAddress, { type: 'address' }),
    nativeToScVal(streamId,        { type: 'u64'     }),
  ]);
}

export async function buildFundStreamXdr(
  employerAddress: string,
  streamId: number,
  amount: string,
): Promise<string> {
  return buildXdr(STREAM_CONTRACT_ID, employerAddress, 'fund_stream', [
    nativeToScVal(employerAddress,   { type: 'address' }),
    nativeToScVal(streamId,          { type: 'u64'     }),
    nativeToScVal(BigInt(amount),    { type: 'i128'    }),
  ]);
}

// ── Treasury write XDRs ───────────────────────────────────────────────────────

export async function buildDepositXdr(
  fromAddress:  string,
  tokenAddress: string,
  amount:       string,
): Promise<string> {
  return buildXdr(VAULT_CONTRACT_ID, fromAddress, 'deposit', [
    nativeToScVal(fromAddress,      { type: 'address' }),
    nativeToScVal(tokenAddress,     { type: 'address' }),
    nativeToScVal(BigInt(amount),   { type: 'i128'    }),
  ]);
}

export async function buildAllocateXdr(
  employerAddress: string,
  streamId:        number,
  tokenAddress:    string,
  amount:          string,
): Promise<string> {
  return buildXdr(VAULT_CONTRACT_ID, employerAddress, 'allocate', [
    nativeToScVal(employerAddress, { type: 'address' }),
    nativeToScVal(streamId,        { type: 'u64'     }),
    nativeToScVal(tokenAddress,    { type: 'address' }),
    nativeToScVal(BigInt(amount),  { type: 'i128'    }),
  ]);
}
