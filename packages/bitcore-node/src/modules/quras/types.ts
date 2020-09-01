import BN from 'bn.js';

import { IBlock } from '../../types/Block';

export interface XqcBlock {
  author: string;
  difficulty: string;
  extraData: string;
  gasLimit: number;
  gasUsed: number;
  hash: string;
  logsBloom: string;
  miner: string;
  mixHash: string;
  nonce: string;
  index: number;
  previousblockhash: string;
  receiptsRoot: string;
  sealFields: Array<string>;
  sha3Uncles: string;
  size: number;
  stateRoot: string;
  time: number;
  totalDifficulty: string;
  tx: Array<XqcTransaction>;
  merkleroot: string;
  uncles: Array<string>;
}
export interface IXqcTransaction {
  scripts: any[] | undefined;
  chain: string;
  network: string;
  blockHeight: number;
  blockHash: string | undefined;
  asset: {
    type: string;
    symbol: string;
    name: string;
  };
  txid: string;
  blockTime: Date;
  blockTimeNormalized: Date;
  fee: number;
  transactionIndex: number;
  value: number;
  wallets: any[];
  to: string;
  from: string;
  nonce?: number;
  type: string;
  size: number;
}
export interface XqcTransaction {
  net_fee: string;
  vin: {
    txid: string;
    vout: number;
  }[];
  vout: {
    n: number;
    asset: string;
    value: string;
    address: string;
  }[];
  blockHash: string | undefined;
  blockNumber: number | undefined;
  chainId: number;
  condition: number;
  scripts: any[] | undefined;
  creates: number;
  from: string;
  gas: number;
  txid: string;
  input: string;
  nonce: number;
  publicKey: string;
  standardV: string;
  transactionIndex: number;
  value: string;
  type: string;
  size: number;
}

export type Networks = 'mainnet' | 'ropsten' | 'rinkeby' | 'goerli' | 'kovan';

export interface EthereumBlock {
  header: EthereumHeader;
  transactions: Transaction[];
  uncleHeaders: EthereumHeader[];
  raw: Buffer[];
  txTrie: any;
}

export interface EthereumHeader {
  parentHash: Buffer;
  uncleHash: Buffer;
  coinbase: Buffer;
  stateRoot: Buffer;
  transactionsTrie: Buffer;
  receiptTrie: Buffer;
  bloom: Buffer;
  difficulty: Buffer;
  number: Buffer;
  gasLimit: Buffer;
  gasUsed: Buffer;
  timestamp: Buffer;
  extraData: Buffer;
  mixHash: Buffer;
  nonce: Buffer;
  raw: Array<Buffer>;
  hash: () => Buffer;
}

export interface Transaction {
  hash: () => Buffer;
  nonce: Buffer;
  gasPrice: Buffer;
  gasLimit: Buffer;
  to: Buffer;
  from: Buffer;
  value: Buffer;
  data: Buffer;
  // EIP 155 chainId - mainnet: 1, ropsten: 3
  chainId: number;
  getUpfrontCost: () => BN;
}

export type IEthBlock = IBlock & {
  coinbase: Buffer;
  nonce: Buffer;
  gasLimit: number;
  gasUsed: number;
  stateRoot: Buffer;
  logsBloom: Buffer;
  sha3Uncles: Buffer;
  receiptsRoot: Buffer;
  merkleRoot: Buffer;
  uncleReward?: Array<number>;
  difficulty: string;
  totalDifficulty: string;
};
