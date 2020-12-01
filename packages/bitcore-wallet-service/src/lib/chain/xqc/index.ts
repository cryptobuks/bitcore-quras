import { Transactions } from 'crypto-wallet-core-quras';
import _ from 'lodash';
import * as log from 'npmlog';
import { IAddress } from 'src/lib/model/address';
import { IChain } from '..';

import QurasLib from 'quras-js';

const Common = require('../../common');
const Constants = Common.Constants;
const Defaults = Common.Defaults;
const Errors = require('../../errors/errordefinitions');

const associatedNetworks = {
  testnet: 'TestNet',
  mainnet: 'MainNet',
  livenet: 'MainNet'
};
export class XqcChain implements IChain {
  /**
   * Converts Bitcore Balance Response.
   * @param {Object} bitcoreBalance - { unconfirmed, confirmed, balance }
   * @param {Number} locked - Sum of txp.amount
   * @returns {Object} balance - Total amount & locked amount.
   */
  private convertBitcoreBalance(bitcoreBalance: any, locked, assetId) {
    // we ASUME all locked as confirmed, for ETH.
    const convertedBalances = {};
    const coins = ['XQC', 'XQG'];
    if (assetId) {
      coins.push(assetId);
    }

    for (let i of coins) {
      const { confirmed, balance } = bitcoreBalance[i] || ({} as any);
      convertedBalances[i] = {
        totalAmount: balance || 0,
        totalConfirmedAmount: confirmed || 0,
        lockedAmount: locked || 0,
        lockedConfirmedAmount: locked || 0,
        availableAmount: balance - locked || 0,
        availableConfirmedAmount: confirmed !== undefined && locked !== undefined ? confirmed - locked : 0,
        byAddress: []
      };
    }

    return convertedBalances;
  }

  notifyConfirmations() {
    return false;
  }

  supportsMultisig() {
    return false;
  }

  getWalletBalance(server, wallet, opts, cb) {
    const bc = server._getBlockchainExplorer(wallet.coin, wallet.network);
    if (opts.assetId) {
      wallet.assetId = opts.assetId;
    }
    bc.getBalance(wallet, (err, balance) => {
      if (err) {
        return cb(err);
      }
      server.getPendingTxs(opts, (err, txps) => {
        if (err) return cb(err);
        const lockedSum = _.sumBy(txps, 'amount') || 0;
        const convertedBalance = this.convertBitcoreBalance(balance, lockedSum, opts.assetId);

        let responseBalance;
        if (!opts.assetId) {
          responseBalance = convertedBalance['XQC'];
          responseBalance.claim = balance.claim;
        } else {
          responseBalance = convertedBalance[opts.assetId];
        }
        responseBalance.gas = convertedBalance['XQG'];

        server.storage.fetchAddresses(server.walletId, (err, addresses: IAddress[]) => {
          if (err) return cb(err);

          if (addresses.length > 0) {
            responseBalance.byAddress = [
              {
                address: addresses[0].address,
                path: addresses[0].path,
                amount: responseBalance.totalAmount
              }
            ];
          }
          return cb(null, responseBalance);
        });
      });
    });
  }

  getWalletSendMaxInfo(server, wallet, opts, cb) {
    server.getBalance({assetId: opts.assetId}, (err, balance) => {
      if (err) return cb(err);
      const { availableAmount } = balance;
      let fee = opts.feePerKb;
      return cb(null, {
        utxosBelowFee: 0,
        amountBelowFee: 0,
        amount: availableAmount - (opts.assetId ? fee : 0),
        feePerKb: opts.feePerKb,
        fee: opts.feePerKb
      });
    });
  }

  getDustAmountValue() {
    return 0;
  }

  getTransactionCount(server, wallet, from) {}

  getChangeAddress() {}

  checkDust(output, opts) {}

  getFee(server, wallet, opts) {
    return new Promise(resolve => {
      server._getFeePerKb(wallet, opts, async (err, inFeePerKb) => {
        resolve({
          fee: inFeePerKb,
          feePerKb: 0,
          gasPrice: 0,
          gasLimit: 0
        });
      });
    });
  }

  getBitcoreTx(txp, opts = { signed: true }) {
    const { data, outputs, assetId } = txp;
    const chain = 'XQCN';
    const recipients = outputs.map(output => {
      return {
        amount: output.amount,
        address: output.toAddress,
        data: output.data,
        gasLimit: output.gasLimit
      };
    });
    // Backwards compatibility BWC <= 8.9.0
    if (data) {
      recipients[0].data = data;
    }
    const unsignedTxs = [];
    for (let index = 0; index < recipients.length; index++) {
      const rawTx = Transactions.create({
        ...txp,
        ...recipients[index],
        chain,
        nonce: Number(txp.nonce) + Number(index),
        recipients: [recipients[index]]
      });
      unsignedTxs.push(rawTx);
    }

    let tx = {
      uncheckedSerialize: () => unsignedTxs,
      txid: () => txp.txid,
      toObject: () => {
        let ret = _.clone(txp);
        ret.outputs[0].satoshis = ret.outputs[0].amount;
        return ret;
      },
      getFee: () => {
        return txp.fee;
      },
      getChangeOutput: () => null
    };

    if (opts.signed) {
      const sigs = txp.getCurrentSignatures();
      sigs.forEach(x => {
        this.addSignaturesToBitcoreTx(tx, txp.inputs, txp.inputPaths, x.signatures, x.xpub);
      });
    }

    return tx;
  }

  convertFeePerKb(p, feePerKb) {
    return [p, feePerKb];
  }

  checkTx(txp) {
    try {
      const tx = this.getBitcoreTx(txp);
    } catch (ex) {
      log.debug('Error building Bitcore transaction', ex);
      return ex;
    }

    return null;
  }

  checkTxUTXOs(server, txp, opts, cb) {
    return cb();
  }

  selectTxInputs(server, txp, wallet, opts, cb) {
    server.getBalance({ wallet, assetId: opts.assetId }, (err, balance) => {
      if (err) return cb(err);

      const { totalAmount, availableAmount } = balance;
      if (totalAmount < txp.getTotalAmount()) {
        return cb(Errors.INSUFFICIENT_FUNDS);
      } else if (availableAmount < txp.getTotalAmount()) {
        return cb(Errors.LOCKED_FUNDS);
      } else {
        return cb(this.checkTx(txp));
      }
    });
  }

  async checkBalanceInfo(server, wallet, opts) {
    const balance = await QurasLib.get.balance(associatedNetworks[wallet.network], opts.from);
    return JSON.parse(JSON.stringify(balance));
  }

  checkUtxos(opts) {}

  checkValidTxAmount(output): boolean {
    if (!_.isNumber(output.amount) || _.isNaN(output.amount) || output.amount < 0) {
      return false;
    }
    return true;
  }

  isUTXOCoin() {
    return false;
  }
  isSingleAddress() {
    return true;
  }

  addressFromStorageTransform(network, address): void {}

  addressToStorageTransform(network, address): void {}

  addSignaturesToBitcoreTx(tx, inputs, inputPaths, signatures, xpub) {
    if (signatures.length === 0) {
      throw new Error('Signatures Required');
    }
    try {
      const chain = 'XQCN';
      const network = tx.network;
      const unsignedTxs = tx.uncheckedSerialize();
      const signedTxs = [];
      for (let index = 0; index < signatures.length; index++) {
        const signed = Transactions.applySignature({
          chain,
          tx: unsignedTxs[index],
          signature: signatures[index]
        });
        signedTxs.push(signed);
        tx.id = Transactions.getHash({ tx: signed, chain, network });
      }
      tx.uncheckedSerialize = () => signedTxs;
    } catch (e) {
      console.log(e);
    }
  }

  validateAddress(wallet, inaddr, opts) {}

  onCoin(coin) {
    return null;
  }

  onTx(tx) {
    return {} as any;
  }
}
