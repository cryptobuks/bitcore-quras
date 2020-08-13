import { Transform } from 'stream';
import { MongoBound } from '../../../models/base';
import { IWallet } from '../../../models/wallet';
import { WalletAddressStorage } from '../../../models/walletAddress';
import { IXqcTransaction } from '../types';

const coinsDecimals =  10**8;

export class XqcListTransactionsStream extends Transform {
  constructor(private wallet: IWallet) {
    super({ objectMode: true });
  }

  async _transform(transaction: MongoBound<IXqcTransaction>, _, done) {
    const sending = await WalletAddressStorage.collection.countDocuments({
      wallet: this.wallet._id,
      address: transaction.from
    });
    if (sending > 0) {
      const sendingToOurself = await WalletAddressStorage.collection.countDocuments({
        wallet: this.wallet._id,
        address: transaction.to
      });
      if (!sendingToOurself) {
        this.push(
          JSON.stringify({
            id: transaction._id,
            txid: transaction.txid,
            fee: transaction.fee * coinsDecimals,
            category: 'send',
            satoshis: -transaction.value * coinsDecimals,
            height: transaction.blockHeight,
            from: transaction.from,
            address: transaction.to,
            blockTime: transaction.blockTimeNormalized,
            scripts: transaction.scripts,
            asset: transaction.asset
          }) + '\n'
        );
      } else {
        this.push(
          JSON.stringify({
            id: transaction._id,
            txid: transaction.txid,
            fee: transaction.fee * coinsDecimals,
            category: 'move',
            satoshis: transaction.value * coinsDecimals,
            height: transaction.blockHeight,
            from: transaction.from,
            address: transaction.to,
            blockTime: transaction.blockTimeNormalized,
            scripts: transaction.scripts,
            asset: transaction.asset
          }) + '\n'
        );
      }
      return done();
    } else {
      const weReceived = await WalletAddressStorage.collection.countDocuments({
        wallet: this.wallet._id,
        address: transaction.to
      });
      if (weReceived > 0) {
        this.push(
          JSON.stringify({
            id: transaction._id,
            txid: transaction.txid,
            fee: transaction.fee * coinsDecimals,
            category: 'receive',
            satoshis: transaction.value * coinsDecimals,
            height: transaction.blockHeight,
            from: transaction.from,
            address: transaction.to,
            blockTime: transaction.blockTimeNormalized,
            scripts: transaction.scripts,
            asset: transaction.asset
          }) + '\n'
        );
      }
    }
    return done();
  }
}
