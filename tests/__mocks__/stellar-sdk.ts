// Minimal stub so tests don't need a live RPC connection
export const Networks = { TESTNET: 'Test SDF Network ; September 2015', PUBLIC: 'Public Global Stellar Network ; September 2015', FUTURENET: 'Test SDF Future Network ; October 2022' };
export const BASE_FEE = '100';
export const Keypair = {
  fromPublicKey: (pk: string) => ({
    verify: (_msg: Buffer, _sig: Buffer) => true,
  }),
  random: () => ({ publicKey: () => 'G' + 'A'.repeat(55), secret: () => 'S' + 'A'.repeat(55) }),
};
export const Contract = jest.fn().mockImplementation(() => ({ call: jest.fn() }));
export const TransactionBuilder = jest.fn().mockImplementation(() => ({
  addOperation: jest.fn().mockReturnThis(),
  setTimeout:   jest.fn().mockReturnThis(),
  build:        jest.fn().mockReturnValue({ toXDR: () => 'mock-xdr' }),
}));
export const xdr = { ScVal: {} };
export const scValToNative = jest.fn().mockReturnValue('mock-native');
export const nativeToScVal  = jest.fn().mockReturnValue({});
export const rpc = {
  Server: jest.fn().mockImplementation(() => ({
    getAccount:           jest.fn().mockResolvedValue({ id: 'GABC', sequenceNumber: () => '0', incrementSequenceNumber: jest.fn() }),
    simulateTransaction:  jest.fn().mockResolvedValue({ result: { retval: {} } }),
    getLatestLedger:      jest.fn().mockResolvedValue({ sequence: 1000000 }),
    getEvents:            jest.fn().mockResolvedValue({ events: [] }),
  })),
  assembleTransaction: jest.fn().mockReturnValue({ build: () => ({ toXDR: () => 'assembled-xdr' }) }),
  Api: {
    isSimulationError: jest.fn().mockReturnValue(false),
  },
};
