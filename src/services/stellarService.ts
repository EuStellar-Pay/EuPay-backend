import { SorobanRpc, Networks } from '@stellar/stellar-sdk';
const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
export const rpcServer = new SorobanRpc.Server(RPC_URL);
export async function getAccountBalance(address: string): Promise<string> {
  try {
    const account = await rpcServer.getAccount(address);
    return (account as any).balances?.find((b: any) => b.asset_type === 'native')?.balance || '0';
  } catch { return '0'; }
}

export async function isValidStellarAddress(address: string): Promise<boolean> {
  return /^G[A-Z0-9]{55}$/.test(address);
}
