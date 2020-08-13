import Config from '../../../config';

import * as request from 'request-promise-native';
import { InternalStateProvider } from '../../../providers/chain-state/internal/internal';
import {
  GetBalanceForAddressParams,
  GetWalletBalanceParams,
  IChainStateService
} from '../../../types/namespaces/ChainStateProvider';
import { XqcBlockStorage } from '../models/block';

import QurasLib, { api as QurasApi } from 'quras-js';
import { Readable } from 'stream';
import { SpentHeightIndicators } from '../../../types/Coin';
import { XqcTransactionStorage } from '../models/transaction';
import { XqcListTransactionsStream } from './transform';

const associatedLevels = {
  normalFee: 'normal'
};

const associatedNetworks = {
  testnet: 'TestNet',
  mainnet: 'TestNet',
  livenet: 'TestNet'
};

export class XQCStateProvider extends InternalStateProvider implements IChainStateService {
  config: any;
  static rpcs = {} as { [network: string]: any };

  constructor(public chain: string = 'XQCN') {
    super(chain);
    this.config = Config.chains[this.chain];
  }

  async getAssetInfo(assetId, network) {
    return QurasApi.qurasDB.getAssetInfo(associatedNetworks[network], assetId);
  }

  async getRPCClient(network: string): Promise<any> {
    try {
      if (XQCStateProvider.rpcs[network]) {
        await XQCStateProvider.rpcs[network].getBlockCount();
      }
    } catch (e) {
      delete XQCStateProvider.rpcs[network];
    }
    if (!XQCStateProvider.rpcs[network]) {
      console.log('making a new connection');
      XQCStateProvider.rpcs[network] = await QurasLib.create.rpcClient(this.config[network].provider.net);
    }
    return XQCStateProvider.rpcs[network];
  }

  async getFee() {
    return request
      .get('https://api.quraswallet.org/getTxFee', {
        json: true,
        rejectUnauthorized: false
      })
      .then(result => {
        const levels = [] as any;
        for (let k in result) {
          if (associatedLevels[k]) {
            levels.push({
              feerate: result[k] * 10 ** 8
            });
          }
        }
        return levels;
      });
  }

  async getBalanceForAddress(params: GetBalanceForAddressParams) {
    const { address } = params;
    const balance = await QurasLib.get.balance(associatedNetworks[params.network], address);
    const allBalances = {} as any;
    const assetSymbols = balance.assetSymbols.filter((name, i) => {
      return balance.assetSymbols.indexOf(name) === i;
    });
    assetSymbols.forEach(assetSymbol => {
      const confirmed = balance.assets[assetSymbol].unspent.reduce((currValue, item) => {
        currValue += Number(item.value) * 10 ** 8;
        return currValue;
      }, 0);
      allBalances[assetSymbol] = {
        confirmed,
        unconfirmed: 0,
        balance: confirmed
      };
    });
    return allBalances;
  }

  async getLocalTip({ chain, network }) {
    return XqcBlockStorage.getLocalTip({ chain, network });
  }

  async broadcastTransaction(params) {
    const client = await this.getRPCClient(params.network);
    const rawTxs = typeof params.rawTx === 'string' ? [params.rawTx] : params.rawTx;

    const txids = new Array<string>();
    for (const tx of rawTxs) {
      const sentTx = await client.sendRawTransaction(tx);
      if (sentTx) {
        const txId = QurasLib.get.transactionHash(QurasLib.deserialize.tx(tx));
        txids.push(txId);
      }
    }
    return txids.length === 1 ? txids[0] : txids;
  }

  async getWalletBalance(params: GetWalletBalanceParams) {
    const { network } = params;
    if (params.wallet._id === undefined) {
      throw new Error('Wallet balance can only be retrieved for wallets with the _id property');
    }
    const addresses = await this.getWalletAddresses(params.wallet._id);
    if (addresses.length) {
      const address = addresses[0].address;
      return await this.getBalanceForAddress({ chain: this.chain, network, address, args: params.args });
    } else {
      return { unconfirmed: 0, confirmed: 0, balance: 0 };
    }
  }

  async getCoinsForTx() {
    return {
      inputs: [],
      outputs: []
    };
  }

  async streamWalletTransactions(params) {
    const { chain, network, wallet, res, args } = params;

    const addresses = await this.getWalletAddresses(params.wallet._id);
    const address = addresses[0].address;

    const query: any = {
      chain,
      network,
      'asset.type': 'GoverningToken'
    };

    query.$and = [
      {
        $or: [{ wallets: wallet._id }, { to: address }, { from: address }]
      }
    ];

    if (args) {
      if (args.startBlock || args.endBlock) {
        let queryOr, andQuery;
        if (query.$and) {
          andQuery = { $or: [] };
          queryOr = andQuery.$or;
          query.$and.push(andQuery);
        } else {
          query.$or = [];
          queryOr = query.$or;
        }

        if (args.includeMempool) {
          queryOr.push({ blockHeight: SpentHeightIndicators.pending });
        }
        let blockRangeQuery = {} as any;
        if (args.startBlock) {
          blockRangeQuery.$gte = Number(args.startBlock);
        }
        if (args.endBlock) {
          blockRangeQuery.$lte = Number(args.endBlock);
        }
        queryOr.push({ blockHeight: blockRangeQuery });
      } else {
        if (args.startDate) {
          const startDate = new Date(args.startDate);
          if (startDate.getTime()) {
            query.blockTimeNormalized = { $gte: new Date(args.startDate) };
          }
        }
        if (args.endDate) {
          const endDate = new Date(args.endDate);
          if (endDate.getTime()) {
            query.blockTimeNormalized = query.blockTimeNormalized || {};
            query.blockTimeNormalized.$lt = new Date(args.endDate);
          }
        }
      }
    }

    let transactionStream = new Readable({ objectMode: true });
    const xqcTransactionTransform = new XqcListTransactionsStream(wallet);
    transactionStream = XqcTransactionStorage.collection
      .find(query)
      .sort({ blockTimeNormalized: 1 })
      .addCursorFlag('noCursorTimeout', true);

    transactionStream.pipe(xqcTransactionTransform).pipe(res);
  }
}

export const XQC = new XQCStateProvider();
