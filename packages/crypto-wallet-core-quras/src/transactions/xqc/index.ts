import * as Quras from 'quras-js';
import { Key } from '../../derivation';

export class XQCTxProvider {
  create(params: {
    recipients: Array<{ address: string; amount: string }>;
    from: string;
    balanceInfo: any;
    fee: number;
  }) {
    const balanceData = params.balanceInfo;
    const balance = new Quras.wallet.Balance(balanceData as any);
    const scriptHash = Quras.wallet.getScriptHashFromAddress(params.recipients[0].address);
    const balanceResult = this.getBalanceJSONData(balanceData);
    const xqgValue = parseFloat(balanceResult['XQGValue']);
    const currentFee = params.fee / 10 ** 8;
    let fee = xqgValue;
    if (xqgValue && xqgValue >= currentFee) {
      fee = currentFee;
    }

    const outputs = [
      {
        assetId: '52a4b58d99af84e0ca33318f3724e92c14835d97af46714a4a68a098a3843276',
        value: Number(params.recipients[0].amount) / 10 ** 8,
        fee,
        scriptHash
      }
    ] as any[];
    const tx = Quras.tx.Transaction.createContractTx(balance, outputs, {});
    return tx.serialize(false);
  }

  getBalanceJSONData(value) {
    const assets = value['assets'];
    const XQCDict = assets['XQC'];
    let XQCValue = 0;
    if (XQCDict !== undefined) {
      XQCValue = Number(XQCDict['balance']);
    }
    const XQGDict = assets['XQG'];
    let XQGValue = 0;
    if (XQGDict !== undefined) {
      XQGValue = Number(XQGDict['balance']);
    }
    const address = value['address'];
    return {
      address,
      XQCValue: XQCValue.toString(),
      XQGValue: XQGValue.toString()
    };
  }

  getSignature(params: { tx: string; key: Key }) {
    const transaction = Quras.tx.Transaction.deserialize(params.tx);
    transaction.sign(params.key.privKey);
    return transaction.serialize(true);
  }

  getHash(params: { tx: string; network?: string }): string {
    const transaction = Quras.tx.Transaction.deserialize(params.tx);
    return Quras.tx.getTransactionHash(transaction);
  }

  applySignature(params: { tx: string; signature: any }) {
    const { signature } = params;
    return signature;
  }

  sign(params: { tx: string; key: Key }) {
    const { tx, key } = params;
    const signature = this.getSignature({ tx, key });
    return this.applySignature({ tx, signature });
  }
}
